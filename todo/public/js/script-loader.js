// Script pour éviter les doubles chargements
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== VÉRIFICATION DES SCRIPTS CHARGÉS ===');
    // Vérifier les doublons de scripts
    const scriptIds = ['popup-script', 'index-script'];
    scriptIds.forEach(id => {
        const scripts = document.querySelectorAll(`script[id="${id}"]`);
        if (scripts.length > 1) {
            console.warn(`Script en double détecté: ${id}`);
            // Supprimer les doublons
            for (let i = 1; i < scripts.length; i++) {
                scripts[i].parentNode.removeChild(scripts[i]);
            }
        }
    });
});
