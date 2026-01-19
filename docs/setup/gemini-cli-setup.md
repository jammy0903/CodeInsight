# Gemini CLI Setup

This file contains the command for using the `@google/gemini-cli`.

## Command

```
npx @google/gemini-cli --apiKey "AIzaSyDBiExwaMQq1VHea-bChAsgsVE180gnqYI" 프로젝트이름:projects/213972727628 프로젝트번호:213972727628
```

## Notes

### Security Warning

The command above contains an API key. This key should be treated as a secret and not be committed to version control. It is recommended to replace the key with a placeholder and store the actual key in a secure location, like a password manager or a local `.env` file that is excluded from Git.

### Command Syntax

The arguments `프로젝트이름` and `프로젝트번호` are in Korean and might not be recognized by the CLI tool. You may need to find the correct command-line flags for specifying the project name and project number. For example, they might look something like this:

```
--project-name projects/213972727628 --project-number 213972727628
```

Please consult the documentation for `@google/gemini-cli` for the correct syntax.
