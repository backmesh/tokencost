/// <reference path="../../../dist/index.d.ts" />
import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { 
  calculatePromptCost, 
  calculateCompletionCost, 
  countStringTokens,
  updateTokenCosts,
  TOKEN_COSTS
} from 'tokencost';

export default function LLMPriceCalculator() {
  const { siteConfig } = useDocusaurusContext();
  const [text, setText] = useState('');
  const [type, setType] = useState('prompt');
  const [selectedModels, setSelectedModels] = useState([
    'gpt-4', 
    'gpt-3.5-turbo', 
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'deepseek-coder'
  ]);
  const [results, setResults] = useState<{
    model: string;
    tokens: number;
    cost: number;
    costPer1kTokens: number;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Update token costs to get the latest models
        await updateTokenCosts();
        
        // Get all available models from TOKEN_COSTS
        const models = Object.keys(TOKEN_COSTS).sort();
        setAvailableModels(models);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load available models. Using default models.');
      }
    };
    
    loadModels();
  }, []);

  const calculateCosts = async () => {
    if (!text.trim()) {
      setError('Please enter some text to calculate costs.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const calculatedResults = await Promise.all(
        selectedModels.map(async (model) => {
          try {
            let cost = 0;
            let tokens = 0;
            
            if (type === 'prompt') {
              cost = await calculatePromptCost(text, model);
              tokens = countStringTokens(text, model);
            } else {
              cost = await calculateCompletionCost(text, model);
              tokens = countStringTokens(text, model);
            }
            
            return {
              model,
              tokens,
              cost,
              costPer1kTokens: (cost / tokens) * 1000
            };
          } catch (err) {
            console.error(`Error calculating for ${model}:`, err);
            return {
              model,
              tokens: 0,
              cost: 0,
              costPer1kTokens: 0,
              error: err.message
            };
          }
        })
      );
      
      setResults(calculatedResults);
    } catch (err) {
      setError('Failed to calculate costs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  // Group models by provider for the selection UI
  const groupedModels = availableModels.reduce((acc, model) => {
    let provider = 'other';
    
    if (model.includes('gpt')) provider = 'openai';
    else if (model.includes('claude')) provider = 'anthropic';
    else if (model.includes('deepseek')) provider = 'deepseek';
    else if (model.includes('llama')) provider = 'meta';
    else if (model.includes('gemini')) provider = 'google';
    
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Layout
      title="LLM Price Calculator"
      description="Prompt or completion price calculation for multiple LLMs side by side"
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--10 col--offset-1">
            <h1 className="margin-bottom--lg margin-top--xl">LLM Price Calculator</h1>

            <div className="margin-bottom--lg" style={{ opacity: 0.8 }}>
              <p>
                This tool calculates token costs for various LLM models. Compare prices side by side for your prompts or completions.
                This tool runs entirely in your browser - no data is transmitted to our servers.
              </p>
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Calculate costs for:
              </label>
              <div className="button-group">
                <button
                  className={`button ${type === 'prompt' ? 'button--primary' : 'button--secondary'}`}
                  onClick={() => setType('prompt')}
                >
                  Prompt (Input)
                </button>
                <button
                  className={`button ${type === 'completion' ? 'button--primary' : 'button--secondary'}`}
                  onClick={() => setType('completion')}
                  style={{ marginLeft: '8px' }}
                >
                  Completion (Output)
                </button>
              </div>
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Enter your text:
              </label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={type === 'prompt' ? 'Enter your prompt text here...' : 'Enter your completion text here...'}
              />
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Select models to compare:
              </label>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '12px', borderRadius: '4px' }}>
                {Object.entries(groupedModels).map(([provider, models]) => (
                  <div key={provider} className="margin-bottom--md">
                    <h4 style={{ textTransform: 'capitalize' }}>{provider}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {models.map(model => (
                        <label key={model} style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center',
                          padding: '4px 8px',
                          backgroundColor: selectedModels.includes(model) ? '#e6f7ff' : '#f5f5f5',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '8px',
                          marginBottom: '8px'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedModels.includes(model)}
                            onChange={() => handleModelChange(model)}
                            style={{ marginRight: '6px' }}
                          />
                          {model}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="margin-bottom--xl">
              <button
                className="button button--primary button--lg"
                onClick={calculateCosts}
                disabled={loading || !text.trim() || selectedModels.length === 0}
              >
                {loading ? 'Calculating...' : 'Calculate Costs'}
              </button>
            </div>

            {error && (
              <div
                className="margin-bottom--md"
                style={{
                  padding: '12px',
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  borderRadius: '4px',
                }}
              >
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="margin-top--xl">
                <h3>Results:</h3>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>Tokens</th>
                        <th>Cost (USD)</th>
                        <th>Cost per 1K tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td>{result.model}</td>
                          <td>{result.tokens}</td>
                          <td>${result.cost.toFixed(6)}</td>
                          <td>${result.costPer1kTokens.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
