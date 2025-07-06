const natural = require('natural');
const wordnet = require('wordnet');
const levenshtein = natural.LevenshteinDistance;

// Initialize WordNet (async)
await wordnet.init();

class SkillMatcher {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.synonymsCache = new Map();
  }

  async getSynonyms(word) {
    if (this.synonymsCache.has(word)) {
      return this.synonymsCache.get(word);
    }

    const synonyms = new Set([word]);
    try {
      const results = await wordnet.lookup(word);
      results.forEach(result => {
        result.synonyms.forEach(syn => synonyms.add(syn.replace(/_/g, ' ')));
      });
    } catch (e) {
      console.log(`No synonyms found for ${word}`);
    }

    this.synonymsCache.set(word, [...synonyms]);
    return [...synonyms];
  }

  async normalizeSkill(skill) {
    // Basic cleaning
    skill = skill.toLowerCase()
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .replace(/[^\w\s/-]/g, '') // Remove special chars
      .trim();

    // Tokenize and process each word
    const words = this.tokenizer.tokenize(skill);
    const processedWords = await Promise.all(words.map(async word => {
      // Stemming
      const stem = this.stemmer.stem(word);
      
      // Get synonyms
      const synonyms = await this.getSynonyms(stem);
      return synonyms.join('|'); // Create regex pattern
    }));

    return processedWords.join(' ');
  }

  async calculateMatch(resumeSkills, jobSkills) {
    // Normalize all skills
    const normResume = await Promise.all(resumeSkills.map(s => this.normalizeSkill(s)));
    const normJob = await Promise.all(jobSkills.map(s => this.normalizeSkill(s)));

    // Calculate matches with fuzzy matching
    const matchedSkills = normResume.filter(resumeSkill => {
      return normJob.some(jobSkill => {
        // Exact match
        if (jobSkill === resumeSkill) return true;

        // Synonym match
        const resumeParts = resumeSkill.split(' ');
        const jobParts = jobSkill.split(' ');
        
        return resumeParts.some(rPart => 
          jobParts.some(jPart => {
            // Check if any synonyms match
            const rSynonyms = rPart.split('|');
            const jSynonyms = jPart.split('|');
            return rSynonyms.some(rs => jSynonyms.some(js => {
              // Use Levenshtein distance for fuzzy matching
              return levenshtein(rs, js, { search: true }) <= 2;
            }));
          })
        );
      });
    });

    return {
      matchCount: matchedSkills.length,
      totalJobSkills: normJob.length,
      percentage: normJob.length > 0 
        ? Math.min(Math.round((matchedSkills.length / normJob.length) * 100), 100)
        : 0
    };
  }
}

module.exports = new SkillMatcher();