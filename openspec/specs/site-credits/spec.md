# Site Credits Specification

## Purpose

Identify who made Code Home and give a keyboard-reachable path to TylerRehm.com, IvyLeagueTech.com, the license, the source repository, and email.

## Requirements

### Requirement: Credit footer
The homepage SHALL end with a footer landmark after the main content. The footer SHALL name Tyler Rehm and Ivy League Tech, LLC as the credits. It SHALL include a link to `https://tylerrehm.com` named TylerRehm.com, a link to `https://ivyleaguetech.com` named IvyLeagueTech.com, a link to the MIT license at `https://github.com/tyler-rehm/browser_home/blob/main/LICENSE`, a link to `https://github.com/tyler-rehm/browser_home`, and a mailto link to `tyler@ivyleaguetech.com`. Each link SHALL have an accessible name, SHALL be reachable from the keyboard, and SHALL use only those destinations.

#### Scenario: The footer is present
- **WHEN** the user reaches the bottom of the homepage
- **THEN** the footer shows the credit, TylerRehm.com, IvyLeagueTech.com, and the license, repository, and email links

#### Scenario: The email link opens a mail client
- **WHEN** the user activates the email link
- **THEN** the destination is `mailto:tyler@ivyleaguetech.com`

#### Scenario: A keyboard user reaches the credits
- **WHEN** the user tabs through the page to the footer
- **THEN** each credit link can receive focus and shows a visible focus style
