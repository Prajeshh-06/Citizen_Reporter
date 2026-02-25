export function analyzePriority(title, description, category = '') {
  const text = `${title} ${description} ${category}`.toLowerCase();
  
  const highKeywords = ['flooding', 'fire', 'accident', 'electrical', 'broken wire', 'emergency', 'urgent', 'danger', 'collapse', 'gas', 'explosion', 'critical'];
  const mediumKeywords = ['pothole', 'garbage', 'trash', 'leak', 'crack', 'street light', 'block', 'water', 'pipe'];
  const lowKeywords = ['noise', 'litter', 'minor', 'suggestion', 'complaint', 'dirty'];

  let score = 0;
  
  for (const kw of highKeywords) {
    if (text.includes(kw)) score += 5;
  }
  for (const kw of mediumKeywords) {
    if (text.includes(kw)) score += 3;
  }
  for (const kw of lowKeywords) {
    if (text.includes(kw)) score += 1;
  }

  let priorityScore = 1;
  if (score >= 10) priorityScore = 5;       
  else if (score >= 5) priorityScore = 4;   
  else if (score >= 3) priorityScore = 3;   
  else if (score >= 1) priorityScore = 2;   
  else priorityScore = 1;                   

  let priorityLabel = 'Low';
  if (priorityScore === 5) priorityLabel = 'Critical';
  else if (priorityScore === 4) priorityLabel = 'High';
  else if (priorityScore === 3 || priorityScore === 2) priorityLabel = 'Medium';
  
  return { priorityScore, priorityLabel };
}
