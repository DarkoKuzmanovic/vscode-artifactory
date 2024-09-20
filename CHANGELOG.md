# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.1](https://github.com/DarkoKuzmanovic/vscode-artifactory/compare/v0.7.0...v0.7.1) (2024-09-20)


### Features

* Add max file size configuration and file size validation ([5589f82](https://github.com/DarkoKuzmanovic/vscode-artifactory/commits/5589f828b4a4d2dafb55540fcbfcc091ce766349))

## [0.7.0](https://github.com/DarkoKuzmanovic/vscode-artifactory/compare/v0.6.2...v0.7.0) (2024-09-20)

* feat: Add max file size configuration and file size validation

### Features

* Add standard-version for automated changelog generation ([929a9ad](https://github.com/DarkoKuzmanovic/vscode-artifactory/commits/929a9ade8494a71f09979a983cc0441d20f30341))

## [0.6.2](https://github.com/DarkoKuzmanovic/vscode-artifactory/compare/v0.6.1...v0.6.2) (2024-09-20)

### Features

* Added standard-release for automated changelog generation

## 0.6.1 (2024-09-20)

### Features

* Add user-configurable file inclusion and exclusion ([cc523d2](https://github.com/DarkoKuzmanovic/vscode-artifactory/commits/cc523d270eb31768789d4d7fa0f6e7df892c8937))

## [0.6.0] (2024-09-18)

### Features

* Added new configuration options for including and excluding file extensions
* Users can now specify includeExtensions and excludeExtensions in settings
* Enhanced file filtering logic to respect user-defined extension preferences
* Improved error handling and user feedback during code extraction process
* Updated output message to reflect user-configured output filename
* Optimized file tree generation for better organization of extracted files

## [0.5.2] - 2024-09-17

* Made smaller changes to code

## [0.5.1] - 2024-09-17

### Changed

* Changed displayName

## [0.5.0] - 2024-09-16

### Added

Initial release of VSCode Artifactory

* Code extraction from various file types
* File tree generation
* Progress indicator during extraction
* Configurable output file name
* Support for .gitignore and .vscodeignore files
* Exclusion of binary files and specific lock files
