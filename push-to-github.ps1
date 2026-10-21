param(
    [Parameter(Mandatory=$false)]
    [string]$Token
)

$gitPath = "C:\Users\Shihab Sharar\.gemini\antigravity-ide\scratch\mingit\cmd\git.exe"
$repo = "eQro-sit/Q.hobby-1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Q.hobby GitHub Auto-Push & Vercel Deploy" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if (-not $Token) {
    Write-Host "GitHub-এ পুশ করার জন্য আপনার Personal Access Token (PAT) লিখুন:" -ForegroundColor Yellow
    Write-Host "(গিটহাব টোকেন না থাকলে GitHub > Settings > Developer Settings > Personal access tokens থেকে ২ মিনিটে বানিয়ে নিন)" -ForegroundColor DarkGray
    $Token = Read-Host "GitHub Token"
}

if ($Token) {
    Write-Host "GitHub-এ ফাইল ও ডাটাবেস আপলোড হচ্ছে..." -ForegroundColor Cyan
    $remoteUrl = "https://${Token}@github.com/${repo}.git"
    & $gitPath push $remoteUrl main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "অভিনন্দন! সফলভাবে GitHub-এ কোড চলে গেছে। Vercel স্বয়ংক্রিয়ভাবে লাইভ ডিপ্লয় করছে!" -ForegroundColor Green
    } else {
        Write-Host "পুশ করতে ত্রুটি হয়েছে। দয়া করে টোকেনের পারমিশন (repo) যাচাই করুন।" -ForegroundColor Red
    }
} else {
    Write-Host "টোকেন দেওয়া হয়নি। পুশ বাতিল করা হলো।" -ForegroundColor Yellow
}
