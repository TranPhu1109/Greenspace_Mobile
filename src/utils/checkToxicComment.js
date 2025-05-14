export const checkToxicComment = async (text) => {
    const API_KEY = 'AIzaSyB76d2jBXyiIjO5fDKFB22S_9mhqEoE36A'; // ← Dán API Key từ Google vào đây
  
    const res = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: { text },
          languages: ['vi'],
          requestedAttributes: {
            TOXICITY: {},
            INSULT: {},
            IDENTITY_ATTACK: {},
          },
        }),
      }
    );
  
    const json = await res.json();
  
    const toxicity = json.attributeScores.TOXICITY?.summaryScore?.value || 0;
    const insult = json.attributeScores.INSULT?.summaryScore?.value || 0;
    const identityAttack = json.attributeScores.IDENTITY_ATTACK?.summaryScore?.value || 0;
  
    const isBad = toxicity > 0.7 || insult > 0.7 || identityAttack > 0.6;
  
    return {
      isBad,
      scores: { toxicity, insult, identityAttack }
    };
  };
  