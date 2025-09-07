const stringSimilarity = require('string-similarity');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'replicate'; // Default to cheapest option
    console.log('AI Provider initialized:', this.provider);
    console.log('Environment AI_PROVIDER:', process.env.AI_PROVIDER);
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case 'mock':
        console.log('Using mock provider for testing');
        break;
      case 'gemini':
        this.apiKey = process.env.GEMINI_API_KEY;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage';
        break;
      case 'together':
        this.apiKey = process.env.TOGETHER_API_KEY;
        this.apiUrl = 'https://api.together.xyz/v1/images/generations';
        break;
      case 'fal':
        this.apiKey = process.env.FAL_API_KEY;
        this.apiUrl = 'https://fal.run/fal-ai/fast-sdxl';
        break;
      case 'replicate':
        this.apiKey = process.env.REPLICATE_API_TOKEN;
        break;
      case 'openai':
        const OpenAI = require('openai');
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        break;
      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  async generateImage(prompt) {
    try {
      // Create smart prompt that handles nonsense words
      const enhancedPrompt = this.createSmartPrompt(prompt);

      switch (this.provider) {
        case 'mock':
          return await this.generateMockImage(enhancedPrompt);
        case 'gemini':
          return await this.generateWithGemini(enhancedPrompt);
        case 'together':
          return await this.generateWithTogether(enhancedPrompt);
        case 'fal':
          return await this.generateWithFal(enhancedPrompt);
        case 'replicate':
          return await this.generateWithReplicate(enhancedPrompt);
        case 'openai':
          return await this.generateWithOpenAI(enhancedPrompt);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`Error generating image with ${this.provider}:`, error);
      throw new Error('Failed to generate image');
    }
  }

  async generateMockImage(prompt) {
    // Return a placeholder image for testing
    console.log('Generating mock image for prompt:', prompt);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

    // Use prompt hash for consistent image per prompt
    const hash = prompt.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return `https://picsum.photos/512/512?random=${Math.abs(hash)}`;
  }

  async generateWithGemini(prompt) {
    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          text: prompt
        },
        generationConfig: {
          aspectRatio: "1:1",
          outputFormat: "JPEG"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    // Gemini returns base64 encoded image, we need to convert it to a URL
    // For now, we'll return the base64 data URL directly
    const base64Image = data.generatedImages[0].bytesBase64Encoded;
    return `data:image/jpeg;base64,${base64Image}`;
  }

  async generateWithTogether(prompt) {
    console.log('Calling Together.ai API with prompt:', prompt);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-dev',
          prompt: prompt,
          width: 1024,
          height: 1024,
          steps: 20,
          n: 1,
          safety_tolerance: 6
        })
      });

      console.log('Together.ai response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Together.ai error response:', errorText);
        throw new Error(`Together API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Together.ai response data:', data);

      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response format from Together.ai');
      }

      return data.data[0].url;
    } catch (error) {
      console.error('Error in generateWithTogether:', error);
      throw error;
    }
  }

  async generateWithFal(prompt) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'square_hd',
        num_inference_steps: 25,
        num_images: 1,
        enable_safety_checker: false
      })
    });

    if (!response.ok) {
      throw new Error(`Fal.ai API error: ${response.status}`);
    }

    const data = await response.json();
    return data.images[0].url;
  }

  async generateWithReplicate(prompt) {
    const Replicate = require('replicate');
    const replicate = new Replicate({
      auth: this.apiKey,
    });

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 4,
          num_outputs: 1,
          disable_safety_checker: true
        }
      }
    );

    return output[0];
  }

  async generateWithOpenAI(prompt) {
    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url;
  }

  calculateSimilarity(originalPrompt, guess) {
    // Use the same improved algorithm as the main server
    const normalize = (text) => text.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const original = normalize(originalPrompt);
    const guessText = normalize(guess);

    // Exact match - perfect score
    if (original === guessText) {
      return {
        points: 100,
        similarity: 1.0,
        wordOverlapRatio: 1.0,
        exactMatch: true
      };
    }

    const originalWords = original.split(/\s+/).filter(w => w.length > 0);
    const guessWords = guessText.split(/\s+/).filter(w => w.length > 0);

    // Calculate metrics using string-similarity library for consistency
    const stringSim = stringSimilarity.compareTwoStrings(original, guessText);

    // Word overlap calculation
    const originalWordSet = new Set(originalWords);
    const guessWordSet = new Set(guessWords);
    const intersection = new Set([...originalWordSet].filter(x => guessWordSet.has(x)));
    const wordOverlapRatio = originalWords.length > 0 ? intersection.size / originalWords.length : 0;

    // Combine string similarity and word overlap with weights
    const combinedSimilarity = (stringSim * 0.6) + (wordOverlapRatio * 0.4);

    // Convert to percentage
    const similarityPercent = Math.round(combinedSimilarity * 100);

    // Calculate points using the same system as main server
    const points = this.calculateGamePoints(similarityPercent);

    return {
      points,
      similarity: combinedSimilarity,
      wordOverlapRatio,
      exactMatch: false
    };
  }

  calculateGamePoints(similarity) {
    // Same point calculation as main server - more generous for guessers
    if (similarity >= 85) return Math.round(similarity + 5);       // 90-105 pts (bonus for great guesses)
    if (similarity >= 70) return Math.round(similarity);           // 70-89 pts (full value)
    if (similarity >= 55) return Math.round(similarity * 0.95);    // 52-84 pts (slight reduction)
    if (similarity >= 40) return Math.round(similarity * 0.85);    // 34-66 pts (more generous)
    if (similarity >= 25) return Math.round(similarity * 0.75);    // 19-52 pts (more generous)
    if (similarity >= 10) return Math.round(similarity * 0.65);    // 7-32 pts (lower threshold)
    return 0;
  }

  // Create smart prompt that handles nonsense words naturally
  createSmartPrompt(originalPrompt) {
    const words = originalPrompt.trim().split(/\s+/);

    // Check if any word looks like nonsense
    const hasNonsenseWords = words.some(word => this.looksLikeNonsense(word));

    if (hasNonsenseWords) {
      console.log(`Detected nonsense in prompt "${originalPrompt}" - rendering as text`);
      // For nonsense words, create a prompt that will render them as text
      return `A simple white background with the text "${originalPrompt}" written clearly in large, bold, black letters. The text should be easily readable and centered on the image. No other elements, just the text "${originalPrompt}" on a plain white background.`;
    } else {
      // For real words, enhance the prompt for better image generation
      console.log(`Creating enhanced prompt for "${originalPrompt}"`);
      return `Create a clear, detailed, and visually striking image of: ${originalPrompt}. The image should be well-lit, high quality, and easily recognizable. Use vibrant colors and good composition. The style should be realistic and detailed, avoiding abstract or overly artistic interpretations that might make it hard to guess the original prompt.`;
    }
  }



  // Simple heuristic to detect likely nonsense words
  looksLikeNonsense(word) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

    // Too short to be nonsense
    // if (cleanWord.length <= 2) return false;

    // Check for basic patterns that suggest nonsense
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';

    let vowelCount = 0;
    let consecutiveConsonants = 0;
    let maxConsecutiveConsonants = 0;

    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];

      if (vowels.includes(char)) {
        vowelCount++;
        consecutiveConsonants = 0;
      } else if (consonants.includes(char)) {
        consecutiveConsonants++;
        maxConsecutiveConsonants = Math.max(maxConsecutiveConsonants, consecutiveConsonants);
      }
    }

    const vowelRatio = vowelCount / cleanWord.length;

    // Likely nonsense if:
    // 1. No vowels in words longer than 3 chars (except common exceptions)
    if (cleanWord.length > 3 && vowelCount === 0) {
      const commonNoVowelWords = ['gym', 'fly', 'try', 'cry', 'dry', 'fry', 'shy', 'sky', 'spy', 'why', 'my', 'by'];
      if (!commonNoVowelWords.includes(cleanWord)) {
        return true;
      }
    }

    // 2. More than 4 consecutive consonants
    if (maxConsecutiveConsonants > 4) {
      return true;
    }

    // 3. Very low vowel ratio in longer words
    if (cleanWord.length > 5 && vowelRatio < 0.1) {
      return true;
    }

    // 4. Check for keyboard patterns
    const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    for (const row of keyboardRows) {
      if (cleanWord.length > 3 && row.includes(cleanWord)) {
        return true;
      }
    }

    // 5. Repeating patterns (like "ababab")
    if (cleanWord.length > 4) {
      let isRepeating = true;
      const patternLength = Math.floor(cleanWord.length / 2);
      for (let len = 2; len <= patternLength; len++) {
        const pattern = cleanWord.substring(0, len);
        const repeated = pattern.repeat(Math.floor(cleanWord.length / len));
        if (repeated === cleanWord.substring(0, repeated.length)) {
          return true;
        }
      }
    }

    return false;
  }

  // Alternative: Use OpenAI embeddings for more sophisticated similarity
  async calculateSemanticSimilarity(originalPrompt, guess) {
    try {
      const [originalEmbedding, guessEmbedding] = await Promise.all([
        this.getEmbedding(originalPrompt),
        this.getEmbedding(guess)
      ]);

      const similarity = this.cosineSimilarity(originalEmbedding, guessEmbedding);

      let points = 0;
      if (similarity >= 0.95) points = 100;
      else if (similarity >= 0.85) points = 80;
      else if (similarity >= 0.75) points = 60;
      else if (similarity >= 0.65) points = 40;
      else if (similarity >= 0.55) points = 20;

      return { points, similarity };
    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      // Fallback to string similarity
      return this.calculateSimilarity(originalPrompt, guess);
    }
  }

  async getEmbedding(text) {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

module.exports = new AIService();