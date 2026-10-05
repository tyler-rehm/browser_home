// @vitest-environment node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  install,
  replaceInstall,
  servicePaths,
  status,
  uninstall,
  writePlist,
} from '../../scripts/home-service.js'

function fixture() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home user-'))
  const buildDir = path.join(home, 'build')
  const nodePath = path.join(home, 'Node App', 'node')
  fs.mkdirSync(buildDir, { recursive: true })
  fs.mkdirSync(path.dirname(nodePath), { recursive: true })
  fs.writeFileSync(path.join(buildDir, 'index.html'), '<h1>home</h1>')
  fs.writeFileSync(nodePath, '')
  const serverFile = path.join(home, 'server.js')
  const configFile = path.join(home, 'homepage.config.json')
  fs.writeFileSync(serverFile, 'export {}\n')
  fs.writeFileSync(configFile, '{"publicHost":"home.localhost"}\n')
  const calls = []
  const deps = {
    platform: 'darwin',
    uid: 501,
    home,
    nodePath,
    buildDir,
    serverFile,
    configFile,
    execFile(command, args) {
      expect(command).toBe('plutil')
      fs.copyFileSync(args[2], args[4])
    },
    run(command, args) {
      calls.push([command, ...args])
      return { status: 0, stdout: '', stderr: '' }
    },
  }
  return { home, deps, calls }
}

describe('macOS service', () => {
  it('installs assets and a structured plist without a shell command string', () => {
    const { home, deps, calls } = fixture()
    const result = install(deps)
    expect(result.ok).toBe(true)
    const paths = servicePaths(home)
    const agent = JSON.parse(fs.readFileSync(paths.plistPath, 'utf8'))
    expect(agent.ProgramArguments).toEqual([
      deps.nodePath,
      path.join(paths.current, 'server.js'),
      '--root',
      path.join(paths.current, 'dist'),
    ])
    expect(agent.ThrottleInterval).toBe(10)
    expect(calls.some((call) => call[1] === 'bootstrap')).toBe(true)
    expect(fs.readFileSync(path.join(paths.current, 'dist', 'index.html'), 'utf8')).toContain(
      'home',
    )
    expect(fs.readFileSync(path.join(paths.current, 'homepage.config.json'), 'utf8')).toContain(
      'home.localhost',
    )
    const other = path.join(home, 'Library', 'Application Support', 'other-app', 'keep.txt')
    fs.mkdirSync(path.dirname(other), { recursive: true })
    fs.writeFileSync(other, 'keep')
    expect(uninstall(deps).ok).toBe(true)
    expect(fs.existsSync(paths.installRoot)).toBe(false)
    expect(fs.readFileSync(other, 'utf8')).toBe('keep')
    expect(status(deps).installed).toBe(false)
  })

  it('reports registration failure and restores a previous install', () => {
    const { home, deps } = fixture()
    install(deps)
    const paths = servicePaths(home)
    fs.writeFileSync(path.join(paths.current, 'dist', 'index.html'), 'old')
    deps.run = (command, args) => ({
      status: args[0] === 'bootstrap' ? 1 : 0,
      stdout: '',
      stderr: '',
    })
    fs.writeFileSync(path.join(deps.buildDir, 'index.html'), 'new')
    const failed = install(deps)
    expect(failed.ok).toBe(false)
    expect(failed.message).toMatch(/not registered/)
    const staging = paths.staging
    fs.mkdirSync(staging)
    expect(() => replaceInstall(staging, paths.current, paths.previous)).toThrow(/incomplete/)
    expect(fs.readFileSync(path.join(paths.current, 'dist', 'index.html'), 'utf8')).toBe('new')
  })

  it('leaves registration in place when unload fails and accepts an absent install', () => {
    const { deps } = fixture()
    expect(uninstall(deps).message).toMatch(/No homepage service/)
    install(deps)
    deps.run = () => ({ status: 1, stdout: '', stderr: 'busy' })
    const result = uninstall(deps)
    expect(result.ok).toBe(false)
    expect(servicePaths(deps.home).plistPath).toBeTruthy()
    expect(fs.existsSync(servicePaths(deps.home).plistPath)).toBe(true)
  })

  it('writes a plist that plutil accepts on macOS', () => {
    if (process.platform !== 'darwin') return
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plist-'))
    const plistPath = path.join(directory, 'agent.plist')
    writePlist(plistPath, {
      Label: 'local.browser-home',
      ProgramArguments: ['/usr/bin/node', '/tmp/server.js'],
    })
    expect(() => execFileSync('plutil', ['-lint', plistPath], { stdio: 'pipe' })).not.toThrow()
  })
})
