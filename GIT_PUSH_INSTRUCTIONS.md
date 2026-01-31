# Git Push Instructions

## Commits Created

The following commits have been created locally and are ready to push:

### Commit 1 (f46eda6)
**feat: Add unlimited audio duration support and multi-format audio conversion**

Major features:
- Enable unlimited audio duration (up to 100MB file size limit)
- Support multiple audio formats: WAV, WebM, MP3, M4A, OGG, FLAC
- Add automatic audio conversion service using FFmpeg
- Move dashboard to /stats route to fix redirect loop issue
- Add custom model name input for Local AI providers

### Commit 2 (74a1d5a)
**feat: Add npm installation support alongside bun**

- Add npm scripts for dev, build, start, and install
- Support both bun and npm for development
- Create comprehensive installation guide
- Maintain bun as primary/recommended option

## Files Changed

### Modified Files:
- `prisma/schema.prisma` - Added customAsrModel and customLlmModel fields
- `src/app/api/transcribe/route.ts` - Removed duration limit, added ASR error handling
- `src/app/page.tsx` - Removed duration validation, added all audio formats
- `src/app/settings/page.tsx` - Added custom model input fields
- `package.json` - Added npm scripts

### New Files:
- `mini-services/audio-converter-service/converter.py` - Python Flask converter service
- `mini-services/audio-converter-service/requirements.txt` - Python dependencies
- `mini-services/audio-converter-service/start.sh` - Startup script
- `src/app/stats/page.tsx` - Statistics page (renamed from dashboard)
- Multiple documentation files (*.md)

### Deleted/Moved:
- `src/app/dashboard/page.tsx` → `src/app/stats/page.tsx`

## How to Push to GitHub

### Option 1: Using Personal Access Token (Recommended)

1. Generate a Personal Access Token on GitHub:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Generate and copy the token

2. Push using the token:
```bash
git push https://<YOUR_TOKEN>@github.com/m4ttgit/Recap.git main
```

Replace `<YOUR_TOKEN>` with your actual GitHub token.

### Option 2: Using GitHub CLI

If you have GitHub CLI installed:
```bash
gh auth login
git push origin main
```

### Option 3: Using SSH Key

If you have SSH key configured:
```bash
git remote set-url origin git@github.com/m4ttgit/Recap.git
git push origin main
```

## Current Git Status

```bash
$ git status
On branch main
Your branch is ahead of 'origin/main' by 2 commits.
```

## Verification

After pushing, verify:
```bash
git log --oneline -3
```

You should see the two commits mentioned above.

## Installation for Users After Push

### With Bun (Recommended):
```bash
git clone https://github.com/m4ttgit/Recap.git
cd Recap
bun install
bun run db:push
bun run dev
```

### With npm:
```bash
git clone https://github.com/m4ttgit/Recap.git
cd Recap
npm install
npx prisma db push
npm run dev:npm
```

## Services to Start

After cloning and installing, start the audio converter service:
```bash
cd mini-services/audio-converter-service
export PYTHONPATH=/home/z/.local/lib/python3.13/site-packages:$PYTHONPATH
python3 converter.py
```

Then start the main app in another terminal:
```bash
bun run dev
# or
npm run dev:npm
```

## Summary

- ✅ 2 commits created locally
- ✅ All changes committed
- ⏳ Ready to push to GitHub
- 📝 Use one of the methods above to push
- 📖 Installation guide available in README_NPM_SUPPORT.md
