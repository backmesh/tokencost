import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  calculatePromptCost,
  calculateCompletionCost,
  countStringTokens,
  TOKEN_COSTS_STATIC
} from '../../../dist';

// Define the type for calculation results
type CalculationResult = {
  model: string;
  tokens: number;
  cost: number;
};

export default function LLMPriceCalculator() {
  const { siteConfig } = useDocusaurusContext();
  const [inputText, setInputText] = useState('');
  const [calculationType, setCalculationType] = useState<'prompt' | 'completion'>('prompt');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4', 'claude-3-opus-20240229', 'deepseek-coder-33b-instruct']);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');

  // Get available models from TOKEN_COSTS_STATIC
  const availableModels = Object.keys(TOKEN_COSTS_STATIC).sort();

  // Group models by provider for better organization in the select dropdown
  const modelsByProvider = availableModels.reduce((acc, model) => {
    const provider = TOKEN_COSTS_STATIC[model]?.litellm_provider || 'other';
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, string[]>);

  // Calculate costs for selected models
  const calculateCosts = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to calculate costs.');
      return;
    }

    setIsCalculating(true);
    setError('');
    
    try {
      const newResults: CalculationResult[] = [];
      
      for (const model of selectedModels) {
        const tokens = countStringTokens(inputText, model);
        let cost = 0;
        
        if (calculationType === 'prompt') {
          cost = await calculatePromptCost(inputText, model);
        } else {
          cost = await calculateCompletionCost(inputText, model);
        }
        
        newResults.push({
          model,
          tokens,
          cost
        });
      }
      
      setResults(newResults);
    } catch (err) {
      setError(`Error calculating costs: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle model selection changes
  const handleModelSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setSelectedModels(selectedValues);
  };

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
                Calculate and compare pricing for prompts or completions across multiple LLM models.
                This tool runs entirely in your browser - no data is transmitted to our servers.
              </p>
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Calculation Type:
              </label>
              <div className="button-group">
                <button
                  className={`button ${calculationType === 'prompt' ? 'button--primary' : 'button--secondary'}`}
                  onClick={() => setCalculationType('prompt')}
                >
                  Prompt
                </button>
                <button
                  className={`button ${calculationType === 'completion' ? 'button--primary' : 'button--secondary'}`}
                  onClick={() => setCalculationType('completion')}
                >
                  Completion
                </button>
              </div>
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Text Input:
              </label>
              <textarea
                className="input"
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Enter your ${calculationType} text here...`}
              />
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Select Models:
              </label>
              <select
                multiple
                className="input"
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
                value={selectedModels}
                onChange={handleModelSelectionChange}
              >
                {Object.entries(modelsByProvider).map(([provider, models]) => (
                  <optgroup key={provider} label={provider.toUpperCase()}>
                    {models.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                Hold Ctrl/Cmd to select multiple models
              </div>
            </div>

            <div className="margin-bottom--xl">
              <button
                className="button button--primary button--lg"
                onClick={calculateCosts}
                disabled={isCalculating || !inputText.trim() || selectedModels.length === 0}
              >
                {isCalculating ? 'Calculating...' : 'Calculate Costs'}
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
                  <table className="table table--striped">
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>Tokens</th>
                        <th>Cost (USD)</th>
                        <th>Cost per 1K Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td>{result.model}</td>
                          <td>{result.tokens.toLocaleString()}</td>
                          <td>${result.cost.toFixed(6)}</td>
                          <td>${(result.cost / result.tokens * 1000).toFixed(6)}</td>
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