// Helpers Handlebars personnalisés

/**
 * Exporte les helpers Handlebars personnalisés
 * @param {Object} handlebars - Instance Handlebars
 */
export const registerHelpers = (handlebars) => {
  // Helper pour comparer deux valeurs (égalité)
  handlebars.registerHelper('eq', function(a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  // Helper pour comparer deux valeurs (inégalité)
  handlebars.registerHelper('ne', function(a, b, options) {
    return a !== b ? options.fn(this) : options.inverse(this);
  });

  // Helper pour comparer si une valeur est supérieure à une autre
  handlebars.registerHelper('gt', function(a, b, options) {
    return a > b ? options.fn(this) : options.inverse(this);
  });

  // Helper pour comparer si une valeur est inférieure à une autre
  handlebars.registerHelper('lt', function(a, b, options) {
    return a < b ? options.fn(this) : options.inverse(this);
  });

  // Helper pour comparer si une valeur est supérieure ou égale à une autre
  handlebars.registerHelper('gte', function(a, b, options) {
    return a >= b ? options.fn(this) : options.inverse(this);
  });

  // Helper pour comparer si une valeur est inférieure ou égale à une autre
  handlebars.registerHelper('lte', function(a, b, options) {
    return a <= b ? options.fn(this) : options.inverse(this);
  });

  // Helper pour formater une date
  handlebars.registerHelper('formatDate', function(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  });

  // Helper pour formater une date avec l'heure
  handlebars.registerHelper('formatDateTime', function(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  // Helper pour vérifier si une valeur est dans un tableau
  handlebars.registerHelper('includes', function(array, value, options) {
    if (!array || !Array.isArray(array)) return options.inverse(this);
    return array.includes(value) ? options.fn(this) : options.inverse(this);
  });

  // Helper pour sélectionner une option dans un select
  handlebars.registerHelper('selected', function(value, option) {
    return value === option ? 'selected' : '';
  });

  // Helper pour vérifier si une valeur est définie
  handlebars.registerHelper('isDefined', function(value, options) {
    return value !== undefined && value !== null ? options.fn(this) : options.inverse(this);
  });

  // Helper pour tronquer un texte
  handlebars.registerHelper('truncate', function(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  });
  
  // Helper pour convertir une chaîne en minuscules
  handlebars.registerHelper('toLowerCase', function(text) {
    if (!text) return '';
    return text.toLowerCase();
  });
};
