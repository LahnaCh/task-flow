$opensslPath = 'C:\Program Files\Git\usr\bin\openssl.exe'
$keyPath = './localhost.key'
$certPath = './localhost.cert'

# Génération des certificats
& $opensslPath req -x509 -nodes -sha256 -days 3650 -subj "/CN=localhost" -addext "subjectAltName = DNS:localhost" -newkey rsa:2048 -keyout $keyPath -out $certPath

Write-Host "Certificats générés avec succès dans le dossier security :"
Write-Host "- $keyPath"
Write-Host "- $certPath" 