class CostTracker {
  constructor() {
    this.costs = {
      gemini: 0.010,      // per image (Imagen 3 Fast)
      together: 0.008,    // per image
      fal: 0.055,         // per image  
      replicate: 0.0023,  // per image
      openai: 0.040       // per image
    };
    
    this.usage = {
      gemini: 0,
      together: 0,
      fal: 0,
      replicate: 0,
      openai: 0
    };
  }

  trackImageGeneration(provider) {
    if (this.usage[provider] !== undefined) {
      this.usage[provider]++;
    }
  }

  getTotalCost() {
    let total = 0;
    for (const [provider, count] of Object.entries(this.usage)) {
      total += count * this.costs[provider];
    }
    return total;
  }

  getUsageStats() {
    const totalImages = Object.values(this.usage).reduce((sum, count) => sum + count, 0);
    const totalCost = this.getTotalCost();
    
    return {
      totalImages,
      totalCost: totalCost.toFixed(4),
      breakdown: Object.entries(this.usage).map(([provider, count]) => ({
        provider,
        images: count,
        cost: (count * this.costs[provider]).toFixed(4),
        percentage: totalImages > 0 ? ((count / totalImages) * 100).toFixed(1) : 0
      }))
    };
  }

  reset() {
    for (const provider in this.usage) {
      this.usage[provider] = 0;
    }
  }
}

module.exports = new CostTracker();