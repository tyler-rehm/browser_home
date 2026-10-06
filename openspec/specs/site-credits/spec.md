# Site Credits Specification

## Purpose

Identify who made Code Home and give a keyboard-reachable path to TylerRehm.com, IvyLeagueTech.com, the license, the source repository, and email.

## Requirements

### Requirement: Credit footer
The homepage SHALL end with a footer landmark after the main content. The footer SHALL name Tyler Rehm and Ivy League Tech, LLC as the credits.

#### Scenario: The footer is present
- **WHEN** the user reaches the bottom of the homepage
- **THEN** the footer shows the credit, TylerRehm.com, IvyLeagueTech.com, and the license, repository, and email links

#### Scenario: A keyboard user reaches the credits
- **WHEN** the user tabs through the page to the footer
- **THEN** each credit link can receive focus and shows a visible focus style

### Requirement: Credit links
The footer SHALL link TylerRehm.com to `https://tylerrehm.com`, IvyLeagueTech.com to `https://ivyleaguetech.com`, the MIT license to `https://github.com/tyler-rehm/browser_home/blob/main/LICENSE`, the repository to `https://github.com/tyler-rehm/browser_home`, and email to `mailto:tyler@ivyleaguetech.com`. Each link SHALL have an accessible name and SHALL use only that destination.

#### Scenario: The email link opens a mail client
- **WHEN** the user activates the email link
- **THEN** the destination is `mailto:tyler@ivyleaguetech.com`
