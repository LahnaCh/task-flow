# Configuration HTTPS pour l'application

Ce dossier contient les certificats nécessaires pour exécuter l'application en mode HTTPS.

## Génération des certificats

Pour générer les certificats, exécutez la commande suivante depuis le terminal Windows (PowerShell) à la racine du projet :

```powershell
cd todo/security
& 'C:\Program Files\Git\usr\bin\openssl.exe' req -x509 -nodes -sha256 -days 3650 -subj "/CN=localhost" -addext "subjectAltName = DNS:localhost" -newkey rsa:2048 -keyout "localhost.key" -out "localhost.cert"
```

Si vous utilisez Git Bash ou un autre terminal Unix, utilisez plutôt cette commande :

```bash
cd todo/security
openssl req -x509 -nodes -sha256 -days 3650 -subj "/CN=localhost" -addext "subjectAltName = DNS:localhost" -newkey rsa:2048 -keyout "localhost.key" -out "localhost.cert"
```

## Contenu du dossier

Après l'exécution de la commande, ce dossier devrait contenir les fichiers suivants :
- `localhost.key` : La clé privée pour le serveur HTTPS
- `localhost.cert` : Le certificat auto-signé pour le serveur HTTPS

## Accepter le certificat auto-signé

Comme il s'agit d'un certificat auto-signé, votre navigateur affichera un avertissement de sécurité lors de la première visite de l'application. Vous devrez manuellement accepter le certificat dans votre navigateur pour continuer.

## Configuration

Le fichier `server.js` est déjà configuré pour utiliser ces certificats lorsque `NODE_ENV` est défini sur `development` dans le fichier `.env`.

## Avertissement

Ces certificats auto-signés ne doivent être utilisés que pour le développement local. Pour un environnement de production, vous devez obtenir des certificats valides auprès d'une autorité de certification reconnue. 