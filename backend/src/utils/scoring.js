function calcProgressScore(uomType, target, actual, deadline, completionDate) {
  if (actual == null || target == null) return 0;
  switch (uomType) {
    case 'min':
      return Math.min(Math.round((actual / target) * 100), 100);
    case 'max':
      if (actual === 0) return 0;
      return Math.min(Math.round((target / actual) * 100), 100);
    case 'timeline':
      if (!completionDate || !deadline) return 0;
      return new Date(completionDate) <= new Date(deadline) ? 100 : 0;
    case 'zero':
      return actual === 0 ? 100 : 0;
    default:
      return 0;
  }
}

module.exports = { calcProgressScore };