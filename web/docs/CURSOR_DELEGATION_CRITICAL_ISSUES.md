# CURSOR DELEGATION PROMPT – CRITICAL ISSUES

This file is a **placeholder**. The content you shared was **raw .docx binary** pasted into chat; that cannot be decoded reliably here.

**To populate this file:**

1. In Windows Explorer, **save your Word file** to this repo, e.g.  
   `web/docs/CURSOR_DELEGATION_CRITICAL_ISSUES.docx`
2. In PowerShell from the repo root, run:

```powershell
.\web\scripts\extract-docx-text.ps1 -Path "web\docs\CURSOR_DELEGATION_CRITICAL_ISSUES.docx" -OutFile "web\docs\CURSOR_DELEGATION_CRITICAL_ISSUES.md"
```

3. Open the generated `.md`, fix headings and lists, then commit.

**Or** open the document in Word and use **File → Save As → Plain Text (\*.txt)**, then paste that into this file and save as UTF-8.

After the text is in this file, you can ask Cursor to triage the critical issues and apply fixes in the codebase.
