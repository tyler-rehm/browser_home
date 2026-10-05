import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const LABEL = 'local.browser-home'

export function servicePaths(home) {
  const installRoot = path.join(home, 'Library', 'Application Support', 'browser-home')
  return {
    installRoot,
    current: path.join(installRoot, 'current'),
    previous: path.join(installRoot, 'previous'),
    staging: path.join(installRoot, 'staging'),
    plistPath: path.join(home, 'Library', 'LaunchAgents', `${LABEL}.plist`),
    logDir: path.join(home, 'Library', 'Logs', 'browser-home'),
  }
}

export function buildLaunchAgent({ nodePath, scriptPath, root, logDir }) {
  return {
    Label: LABEL,
    ProgramArguments: [nodePath, scriptPath, '--root', root],
    WorkingDirectory: path.dirname(scriptPath),
    RunAtLoad: true,
    KeepAlive: true,
    ThrottleInterval: 10,
    StandardOutPath: path.join(logDir, 'home.log'),
    StandardErrorPath: path.join(logDir, 'home.err'),
  }
}

export function writePlist(plistPath, object, execFile = execFileSync) {
  fs.mkdirSync(path.dirname(plistPath), { recursive: true, mode: 0o755 })
  const jsonPath = `${plistPath}.writing.json`
  fs.writeFileSync(jsonPath, `${JSON.stringify(object)}\n`, { mode: 0o644 })
  try {
    execFile('plutil', ['-convert', 'xml1', jsonPath, '-o', plistPath], { stdio: 'pipe' })
    fs.chmodSync(plistPath, 0o644)
  } finally {
    fs.rmSync(jsonPath, { force: true })
  }
}

export function replaceInstall(staging, current, previous) {
  fs.rmSync(previous, { recursive: true, force: true })
  if (fs.existsSync(current)) fs.renameSync(current, previous)
  try {
    fs.renameSync(staging, current)
    const index = path.join(current, 'dist', 'index.html')
    const server = path.join(current, 'server.js')
    if (!fs.existsSync(index) || !fs.existsSync(server)) throw new Error('incomplete install')
    fs.rmSync(previous, { recursive: true, force: true })
  } catch (error) {
    fs.rmSync(current, { recursive: true, force: true })
    if (fs.existsSync(previous)) fs.renameSync(previous, current)
    fs.rmSync(staging, { recursive: true, force: true })
    throw error
  }
}

function fail(message) {
  return { ok: false, message }
}

function runCommand(run, command, args) {
  try {
    return run(command, args)
  } catch (error) {
    return {
      status: 1,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'command failed',
    }
  }
}

export function install(deps) {
  if (deps.platform !== 'darwin') return fail('Login startup is only implemented for macOS.')
  if (deps.uid === 0) return fail('Run the installer as your user, not as root.')
  if (!path.isAbsolute(deps.nodePath) || !fs.existsSync(deps.nodePath)) {
    return fail(
      'The Node executable path is not usable. Reinstall after Node is available at a stable path.',
    )
  }
  const index = path.join(deps.buildDir, 'index.html')
  if (!fs.existsSync(index) || !fs.statSync(index).isFile()) {
    return fail('Built assets are missing. Run `npm run build` first.')
  }
  if (!deps.configFile || !fs.existsSync(deps.configFile)) {
    return fail('Homepage address config is missing.')
  }
  const paths = servicePaths(deps.home)
  fs.rmSync(paths.staging, { recursive: true, force: true })
  fs.mkdirSync(paths.staging, { recursive: true, mode: 0o755 })
  fs.mkdirSync(paths.logDir, { recursive: true, mode: 0o755 })
  fs.cpSync(deps.buildDir, path.join(paths.staging, 'dist'), { recursive: true })
  fs.copyFileSync(deps.serverFile, path.join(paths.staging, 'server.js'))
  fs.copyFileSync(deps.configFile, path.join(paths.staging, 'homepage.config.json'))
  fs.chmodSync(path.join(paths.staging, 'server.js'), 0o644)
  try {
    replaceInstall(paths.staging, paths.current, paths.previous)
  } catch {
    return fail('Install failed and the previous copy was restored.')
  }
  const agent = buildLaunchAgent({
    nodePath: deps.nodePath,
    scriptPath: path.join(paths.current, 'server.js'),
    root: path.join(paths.current, 'dist'),
    logDir: paths.logDir,
  })
  try {
    writePlist(paths.plistPath, agent, deps.execFile)
  } catch {
    return fail(`The service file could not be written. See ${paths.logDir}.`)
  }
  runCommand(deps.run, 'launchctl', ['bootout', `gui/${deps.uid}`, paths.plistPath])
  const registered = runCommand(deps.run, 'launchctl', [
    'bootstrap',
    `gui/${deps.uid}`,
    paths.plistPath,
  ])
  if (registered.status !== 0) {
    return fail(`Login startup was not registered. See ${paths.logDir}.`)
  }
  return { ok: true, message: `Homepage service installed. Logs: ${paths.logDir}` }
}

export function uninstall(deps) {
  if (deps.platform !== 'darwin') return fail('Login startup is only implemented for macOS.')
  const paths = servicePaths(deps.home)
  const hadPlist = fs.existsSync(paths.plistPath)
  const hadInstall = fs.existsSync(paths.installRoot)
  if (!hadPlist && !hadInstall) return { ok: true, message: 'No homepage service is installed.' }
  if (hadPlist) {
    const stopped = runCommand(deps.run, 'launchctl', [
      'bootout',
      `gui/${deps.uid}`,
      paths.plistPath,
    ])
    if (stopped.status !== 0) {
      return fail('Could not unload the service. Its registration was left in place.')
    }
    fs.rmSync(paths.plistPath, { force: true })
  }
  fs.rmSync(paths.installRoot, { recursive: true, force: true })
  return {
    ok: true,
    message:
      'Homepage service removed. Notes, links, and preferences in the browser were not changed.',
  }
}

export function status(deps) {
  const paths = servicePaths(deps.home)
  const installed = fs.existsSync(path.join(paths.current, 'dist', 'index.html'))
  const plist = fs.existsSync(paths.plistPath)
  let registration = 'not registered'
  if (plist) {
    const printed = runCommand(deps.run, 'launchctl', ['print', `gui/${deps.uid}/${LABEL}`])
    registration = printed.status === 0 ? 'registered' : 'not registered'
  }
  return {
    installed,
    plist,
    registration,
    logs: paths.logDir,
    message: installed
      ? `Installed assets are present and the service is ${registration}. Logs: ${paths.logDir}`
      : 'No homepage service is installed.',
  }
}

function liveDeps(argv) {
  const buildFlag = argv.indexOf('--build')
  return {
    platform: process.platform,
    uid: typeof process.getuid === 'function' ? process.getuid() : 501,
    home: os.homedir(),
    nodePath: process.execPath,
    buildDir: path.resolve(buildFlag >= 0 ? argv[buildFlag + 1] : path.join(process.cwd(), 'dist')),
    serverFile: path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/server.js'),
    configFile: path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../src/homepage.config.json',
    ),
    execFile: execFileSync,
    run(command, args) {
      try {
        const stdout = execFileSync(command, args, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        })
        return { status: 0, stdout, stderr: '' }
      } catch (error) {
        return {
          status: error.status ?? 1,
          stdout: error.stdout?.toString() ?? '',
          stderr: error.stderr?.toString() ?? error.message,
        }
      }
    },
  }
}

export function execute(argv, deps = liveDeps(argv)) {
  const command = argv.find((arg) => !arg.startsWith('--'))
  if (command === 'install' || command === 'update') {
    const result = install(deps)
    console.log(result.message)
    return result.ok ? 0 : 1
  }
  if (command === 'status') {
    console.log(status(deps).message)
    return 0
  }
  if (command === 'uninstall') {
    const result = uninstall(deps)
    console.log(result.message)
    return result.ok ? 0 : 1
  }
  console.error('Usage: node scripts/home-service.js <install|update|status|uninstall>')
  return 1
}

const invoked =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invoked) process.exitCode = execute(process.argv.slice(2))
