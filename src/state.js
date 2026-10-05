import { DEFAULT_LINKS, DEFAULT_PREFERENCES } from './data.js'
import { KEYS, readText } from './persistence.js'
import { validateLinkList, validateNotes, validateStoredPreferences } from './records.js'

function hold(recovery, message) {
  recovery.push(message)
}

export function loadHomepage(storage) {
  const recovery = []
  let preserveLinks = false
  let preserveNotes = false
  let preservePreferences = false

  const storedLinks = readText(storage, KEYS.links)
  let links = DEFAULT_LINKS
  if (storedLinks.state === 'blocked') {
    preserveLinks = true
    hold(recovery, 'Saved links could not be read. They were left untouched.')
  } else if (storedLinks.state === 'present') {
    let parsed
    try {
      parsed = JSON.parse(storedLinks.raw)
    } catch {
      parsed = null
    }
    if (parsed == null) {
      preserveLinks = true
      hold(recovery, 'Saved links could not be read. They were left untouched.')
    } else {
      const result = validateLinkList(parsed)
      if (!result.ok || result.skipped.length) {
        preserveLinks = true
        links = result.ok && result.value.length ? result.value : DEFAULT_LINKS
        hold(
          recovery,
          'Some saved links were unsafe or malformed and are not shown. They stay in storage until you change the list.',
        )
      } else {
        links = result.value
      }
    }
  }

  const storedNotes = readText(storage, KEYS.notes)
  let notes = ''
  if (storedNotes.state === 'blocked') {
    preserveNotes = true
    hold(recovery, 'Saved notes could not be read. They were left untouched.')
  } else if (storedNotes.state === 'present') {
    const result = validateNotes(storedNotes.raw)
    if (!result.ok) {
      preserveNotes = true
      hold(recovery, 'Saved notes could not be used. They were left untouched.')
    } else {
      notes = result.value
    }
  }

  const storedPreferences = readText(storage, KEYS.preferences)
  let preferences = { ...DEFAULT_PREFERENCES }
  if (storedPreferences.state === 'blocked') {
    preservePreferences = true
    hold(recovery, 'Saved appearance could not be read. It was left untouched.')
  } else if (storedPreferences.state === 'present') {
    let parsed
    try {
      parsed = JSON.parse(storedPreferences.raw)
    } catch {
      parsed = null
    }
    const result = parsed && validateStoredPreferences(parsed, DEFAULT_PREFERENCES)
    if (!result || !result.ok) {
      preservePreferences = true
      hold(recovery, 'Saved appearance could not be used. It was left untouched.')
    } else {
      preferences = result.value
      if (result.repaired) {
        preservePreferences = true
        hold(
          recovery,
          'Some saved appearance values were reset to defaults and were not written back.',
        )
      }
    }
  }

  return { links, notes, preferences, recovery, preserveLinks, preserveNotes, preservePreferences }
}
