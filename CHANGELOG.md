# Change Log

All notable changes to the "vscode-artifactory" extension will be documented in this file.

## [0.6.0] - 2024-09-18

- Added new configuration options for including and excluding file extensions
- Users can now specify includeExtensions and excludeExtensions in settings
- Enhanced file filtering logic to respect user-defined extension preferences
- Improved error handling and user feedback during code extraction process
- Updated output message to reflect user-configured output filename
- Optimized file tree generation for better organization of extracted files

## [0.5.2] - 2024-09-17

- Made smaller changes to code

## [0.5.1] - 2024-09-17

### Changed

- Changed displayName

## [0.5.0] - 2024-09-16

### Added

Initial release of VSCode Artifactory

- Code extraction from various file types
- File tree generation
- Progress indicator during extraction
- Configurable output file name
- Support for .gitignore and .vscodeignore files
- Exclusion of binary files and specific lock files
