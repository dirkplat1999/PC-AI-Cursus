# Zorgt dat er een werkende Node.js beschikbaar is voor het startscript,
# zonder dat de gebruiker iets hoeft te installeren of admin-rechten nodig
# heeft: als Node.js al op het systeem staat wordt die gebruikt, anders
# wordt een portable (zip-)versie eenmalig gedownload naar .\node-portable.
#
# Schrijft bij succes het pad naar de map met node.exe/npm.cmd naar
# -ResultFile (één regel, geen newline erachter) en sluit af met code 0.
# Bij falen wordt niets naar ResultFile geschreven en is de exit code 1.

param(
  [string]$ResultFile = "$env:TEMP\pcai-node-bin.txt"
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$portableRoot = Join-Path $projectRoot 'node-portable'
$portableNodeExe = Join-Path $portableRoot 'node.exe'

try {
  if (Test-Path $portableNodeExe) {
    Write-Host "Eerder gedownloade Node.js wordt gebruikt ($portableRoot)."
    Set-Content -Path $ResultFile -Value $portableRoot -NoNewline
    exit 0
  }

  $systemNode = Get-Command node -ErrorAction SilentlyContinue
  if ($systemNode) {
    $systemBin = Split-Path $systemNode.Source -Parent
    Write-Host "Node.js is al op dit systeem geinstalleerd, die wordt gebruikt."
    Set-Content -Path $ResultFile -Value $systemBin -NoNewline
    exit 0
  }

  Write-Host "Node.js is niet gevonden op dit systeem."
  Write-Host "Node.js wordt eenmalig automatisch gedownload (geen installatie of rechten nodig)..."

  $rawArch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
  $nodeArch = switch ($rawArch) {
    'AMD64' { 'x64' }
    'ARM64' { 'arm64' }
    default { $null }
  }
  if (-not $nodeArch) {
    throw "Niet-ondersteunde processorarchitectuur ($rawArch) voor automatische download."
  }

  $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing
  $lts = $index | Where-Object { $_.lts -ne $false } | Select-Object -First 1
  if (-not $lts) { throw "Kon geen Node.js LTS-versie vinden op nodejs.org." }

  $version = $lts.version
  $zipUrl = "https://nodejs.org/dist/$version/node-$version-win-$nodeArch.zip"
  $tmpZip = Join-Path $env:TEMP "pcai-node-$version-$nodeArch.zip"
  $tmpExtract = Join-Path $env:TEMP "pcai-node-extract-$version-$nodeArch"

  Write-Host "Downloaden van Node.js $version ($nodeArch)..."
  Invoke-WebRequest -Uri $zipUrl -OutFile $tmpZip -UseBasicParsing

  Remove-Item -Recurse -Force $tmpExtract -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Path $tmpExtract -Force | Out-Null
  Expand-Archive -Path $tmpZip -DestinationPath $tmpExtract -Force

  $extractedFolder = Get-ChildItem $tmpExtract -Directory | Select-Object -First 1
  if (-not $extractedFolder) { throw "Uitpakken van het Node.js-archief is mislukt." }

  Remove-Item -Recurse -Force $portableRoot -ErrorAction SilentlyContinue
  Move-Item -Path $extractedFolder.FullName -Destination $portableRoot

  Remove-Item -Force $tmpZip -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force $tmpExtract -ErrorAction SilentlyContinue

  if (-not (Test-Path $portableNodeExe)) { throw "Node.js is gedownload maar node.exe is niet gevonden op de verwachte plek." }

  Write-Host "Node.js $version is gedownload naar '$portableRoot'."
  Set-Content -Path $ResultFile -Value $portableRoot -NoNewline
  exit 0
}
catch {
  Write-Host "FOUT: kon Node.js niet automatisch downloaden: $($_.Exception.Message)"
  exit 1
}
