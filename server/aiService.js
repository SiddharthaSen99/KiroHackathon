const stringSimilarity = require('string-similarity');

class AIService {
  constructor() {
    this.provider = 'together'; // Use mock for testing game mechanics
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
      switch (this.provider) {
        case 'mock':
          return await this.generateMockImage(prompt);
        case 'gemini':
          return await this.generateWithGemini(prompt);
        case 'together':
          return await this.generateWithTogether(prompt);
        case 'fal':
          return await this.generateWithFal(prompt);
        case 'replicate':
          return await this.generateWithReplicate(prompt);
        case 'openai':
          return await this.generateWithOpenAI(prompt);
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
          n: 1
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
        num_images: 1
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
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 20,
          num_outputs: 1
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
    // Normalize both strings
    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .trim();
    };

    const normalizedOriginal = normalizeText(originalPrompt);
    const normalizedGuess = normalizeText(guess);

    // Calculate different similarity metrics
    const exactMatch = normalizedOriginal === normalizedGuess;
    const similarity = stringSimilarity.compareTwoStrings(normalizedOriginal, normalizedGuess);
    
    // Check for word overlap
    const originalWords = new Set(normalizedOriginal.split(/\s+/));
    const guessWords = new Set(normalizedGuess.split(/\s+/));
    const intersection = new Set([...originalWords].filter(x => guessWords.has(x)));
    const wordOverlapRatio = intersection.size / originalWords.size;

    // Calculate final score
    let points = 0;
    
    if (exactMatch) {
      points = 100;
    } else if (similarity >= 0.8 || wordOverlapRatio >= 0.8) {
      points = 80;
    } else if (similarity >= 0.6 || wordOverlapRatio >= 0.6) {
      points = 60;
    } else if (similarity >= 0.4 || wordOverlapRatio >= 0.4) {
      points = 40;
    } else if (similarity >= 0.2 || wordOverlapRatio >= 0.2) {
      points = 20;
    }

    return {
      points,
      similarity,
      wordOverlapRatio,
      exactMatch
    };
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