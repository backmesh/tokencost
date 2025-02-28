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
  inputCost: number;
  outputCost: number;
};

export default function LLMPriceCalculator() {
  const [inputText, setInputText] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4']);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  // Get available models from TOKEN_COSTS_STATIC, ensuring they have both input and output costs
  const availableModels = Object.entries(TOKEN_COSTS_STATIC)
    .filter(([_, modelInfo]) => 
      modelInfo.input_cost_per_token !== undefined && 
      modelInfo.output_cost_per_token !== undefined &&
      modelInfo.litellm_provider !== 'ollama'
    )
    .map(([model]) => model)
    .sort();

  // Group models by provider for better organization in the select dropdown
  const modelsByProvider = availableModels.reduce((acc, model) => {
    const provider = TOKEN_COSTS_STATIC[model]?.litellm_provider || 'other';
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, string[]>);

  // Filter models based on search input
  const filteredModelsByProvider = Object.entries(modelsByProvider).reduce((acc, [provider, models]) => {
    const filteredModels = models.filter(model => 
      model.toLowerCase().includes(modelFilter.toLowerCase())
    );
    
    if (filteredModels.length > 0) {
      acc[provider] = filteredModels;
    }
    
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
        const inputCost = await calculatePromptCost(inputText, model);
        const outputCost = await calculateCompletionCost(inputText, model);
        
        newResults.push({
          model,
          tokens,
          inputCost,
          outputCost
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
      description="Price calculation for multiple LLMs side by side"
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--10 col--offset-1">
            <h1 className="margin-bottom--lg margin-top--xl">LLM Price Calculator</h1>

            <div className="margin-bottom--lg" style={{ opacity: 0.8 }}>
              <p>
                Calculate pricing input and output costs for a text sample across multiple LLM models.
                This tool runs entirely in your browser - no data is transmitted to our servers.
              </p>
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
                placeholder="Enter your text here..."
              />
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Models:
              </label>
              <input
                type="text"
                className="input"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  marginBottom: '8px',
                }}
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                placeholder="Filter models..."
              />
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
                {Object.entries(filteredModelsByProvider).map(([provider, models]) => (
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
              
              {/* Display selected models as tags */}
              {selectedModels.length > 0 && (
                <div className="margin-top--md">
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Selected Models ({selectedModels.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedModels.map(model => (
                      <div 
                        key={model}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: 'var(--ifm-color-primary-lightest, #e6f6ff)',
                          color: 'var(--ifm-color-primary-darkest, #0076ce)',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '14px',
                        }}
                      >
                        <span>{model}</span>
                        <button
                          onClick={() => {
                            setSelectedModels(selectedModels.filter(m => m !== model));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '6px',
                            padding: '0 4px',
                            fontSize: '16px',
                            color: 'var(--ifm-color-primary-dark, #0076ce)',
                          }}
                          aria-label={`Remove ${model}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                        <th>Input Cost per 1K Tokens</th>
                        <th>Cost as Input (USD)</th>
                        <th>Output Cost per 1K Tokens</th>
                        <th>Cost as Output (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td>{result.model}</td>
                          <td>{result.tokens.toLocaleString()}</td>
                          <td>${parseFloat((result.inputCost / result.tokens * 1000).toFixed(6))}</td>
                          <td>${parseFloat(result.inputCost.toFixed(6))}</td>
                          <td>${parseFloat((result.outputCost / result.tokens * 1000).toFixed(6))}</td>
                          <td>${parseFloat(result.outputCost.toFixed(6))}</td>
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