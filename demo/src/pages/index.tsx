import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { 
  calculatePromptCost, 
  calculateCompletionCost, 
  countStringTokens,
  updateTokenCosts,
  TOKEN_COSTS
} from 'tokencost-js';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Helper function to format costs in scientific notation
const formatCostScientific = (cost: number): string => {
  return cost.toExponential(4);
};

export default function LLMComparisonTool() {
  const { siteConfig } = useDocusaurusContext();
  const [prompt, setPrompt] = useState('');
  const supportedModels = ['deepseek/deepseek-chat', 'claude-3-5-sonnet-latest', 'gpt-4o'];
  const [selectedModels, setSelectedModels] = useState(supportedModels);
  const [results, setResults] = useState<{
    model: string;
    response: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    costs: {
      prompt: number;
      completion: number;
      total: number;
    };
    time: number;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelErrors, setModelErrors] = useState<Record<string, string>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Update token costs to get the latest models
        await updateTokenCosts();
        
        // Filter for only the models we want to support
        // const supportedProviders = ['openai', 'anthropic', 'gemini', 'cloudflare'];
        const models = Object.keys(TOKEN_COSTS)
          .filter(model => {
            // const provider = TOKEN_COSTS[model]?.litellm_provider;
            return supportedModels.includes(model);
          })
          .sort();
        
        setAvailableModels(models);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load available models. Using default models.');
      }
    };
    
    loadModels();
  }, []);

  // Initialize SDK clients
  const initializeClients = async () => {
    firebase.initializeApp({
      apiKey: "AIzaSyAYbn4at9zM-iq5UqsI9tDzU03NY-R8wV8",
    });
    const auth = firebase.auth();
    const user = auth.currentUser;
    let jwt = '';
    if (!user) {
      const cred = await auth.signInAnonymously()
      jwt = await cred.user?.getIdToken();
    } else {
      jwt = await user.getIdToken();
    }
    // This is a placeholder implementation - in a real app, you would import the actual SDKs
    const openai =  new OpenAI({
      apiKey: jwt,
      dangerouslyAllowBrowser: true, // no longer dangerous
      baseURL: 'https://edge.backmesh.com/v1/proxy/PyHU4LvcdsQ4gm2xeniAFhMyuDl2/Uuf7JCuS4SklDFJeeDFR/v1',
    });    
    
    // Initialize Anthropic client with the SDK
    const anthropic = new Anthropic({
      apiKey: jwt,
      baseURL: 'https://edge.backmesh.com/v1/proxy/PyHU4LvcdsQ4gm2xeniAFhMyuDl2/wj4n16VncpotUPIrwxEi',
      dangerouslyAllowBrowser: true, // no longer dangerous
    });
    return { openai, anthropic, jwt };
  };

  // Function to get responses from selected models
  const getModelResponses = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to compare LLM responses.');
      return;
    }

    setLoading(true);
    setError('');
    setModelErrors({});
    setResults([]);

    const clients = await initializeClients();
    
    try {
      const responses = await Promise.allSettled(
        selectedModels.map(async (model) => {
          const startTime = Date.now();
          let response = '';
          let promptTokens = 0;
          let completionTokens = 0;
          
          try {
            // Get response based on model provider
            if (model.includes('gpt')) {
              const completion = await clients.openai.chat.completions.create({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
              });
              response = completion.choices[0]?.message?.content || '';
              promptTokens = completion.usage?.prompt_tokens || countStringTokens(prompt, model);
              completionTokens = completion.usage?.completion_tokens || countStringTokens(response, model);
            } 
            else if (model.includes('claude')) {
              const completion = await clients.anthropic.messages.create({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000,
              });
              
              // Extract text from Anthropic response
              const contentBlock = completion.content.find(item => item.type === 'text');
              response = contentBlock ? contentBlock.text : '';
              
              // Get token counts from usage
              promptTokens = completion.usage?.input_tokens || countStringTokens(prompt, model);
              completionTokens = completion.usage?.output_tokens || countStringTokens(response, model);
            } 
            else if (model.includes('deepseek')) {
              const endpoint = 'client/v4/accounts/e4f5d18aedd28895008b8e1f6845a3bc/ai/run/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
              const resp = await fetch(`https://edge.backmesh.com/v1/proxy/PyHU4LvcdsQ4gm2xeniAFhMyuDl2/iybKOnMO7hcyW6rnc58F/${endpoint}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${clients.jwt}`,
                },
                body: JSON.stringify({
                  messages: [{ role: 'user', content: prompt }],
                }),
              });
              
              if (!resp.ok) {
                const errorData = await resp.json();
                throw new Error(errorData.error?.message || `DeepSeek API error: ${resp.status}`);
              }
              
              const completion = await resp.json();
              console.log(completion);
              response = completion.result?.response || '';
              promptTokens = completion.result?.usage?.prompt_tokens || countStringTokens(prompt, model);
              completionTokens = completion.result?.usage?.completion_tokens || countStringTokens(response, model);
            }
            
            const endTime = Date.now();
            const promptCost = await calculatePromptCost(prompt, model);
            const completionCost = await calculateCompletionCost(response, model);
            
            return {
              model,
              response,
              tokens: {
                prompt: promptTokens,
                completion: completionTokens,
                total: promptTokens + completionTokens
              },
              costs: {
                prompt: promptCost,
                completion: completionCost,
                total: promptCost + completionCost
              },
              time: endTime - startTime
            };
          } catch (err) {
            console.error(`Error getting response from ${model}:`, err);
            // Update model errors state
            setModelErrors(prev => ({
              ...prev,
              [model]: err.message || 'Unknown error occurred'
            }));
            return {
              model,
              response: `Error: ${err.message}`,
              tokens: {
                prompt: promptTokens,
                completion: 0,
                total: promptTokens
              },
              costs: {
                prompt: await calculatePromptCost(prompt, model),
                completion: 0,
                total: await calculatePromptCost(prompt, model)
              },
              time: Date.now() - startTime
            };
          }
        })
      );
      
      const processedResults = responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            model: selectedModels[index],
            response: `Error: ${result.reason.message}`,
            tokens: { prompt: 0, completion: 0, total: 0 },
            costs: { prompt: 0, completion: 0, total: 0 },
            time: 0
          };
        }
      });
      
      setResults(processedResults);
    } catch (err) {
      setError('Failed to get responses: ' + err.message);
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

  return (
    <Layout
      title="Compare LLM answers and costs for the same prompt"
      description="Compare responses and costs from multiple LLMs side by side"
    >
      <div className="container margin-vert--md">
        <div className="row">
          <div className="col col--10 col--offset-1">
            <h1 className="margin-bottom--lg margin-top--xl">LLM Comparison Tool</h1>

            <div className="margin-bottom--lg" style={{ opacity: 0.8 }}>
              <p>
                This tool allows you to compare responses and costs from the most popular LLM models for the same prompt.
                Enter your prompt below, and see the results side by side.
                This tool runs entirely in your browser.
              </p>
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Enter your prompt:
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
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
              />
            </div>

            <div className="margin-bottom--lg">
              <label className="margin-bottom--sm" style={{ display: 'block', fontWeight: 'bold' }}>
                Select models to compare:
              </label>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '12px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableModels.map(model => (
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
            </div>

            <div className="margin-bottom--xl">
              <button
                className="button button--primary button--lg"
                onClick={getModelResponses}
                disabled={loading || !prompt.trim() || selectedModels.length === 0}
              >
                {loading ? 'Getting Responses...' : 'Compare LLMs'}
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

            {Object.keys(modelErrors).length > 0 && (
              <div className="margin-bottom--md">
                <h4>Model Errors:</h4>
                {Object.entries(modelErrors).map(([model, errorMessage]) => (
                  <div
                    key={model}
                    style={{
                      padding: '10px',
                      backgroundColor: '#fff3e0',
                      color: '#e65100',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <strong>{model}:</strong> {errorMessage}
                  </div>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="margin-top--xl">
                <h3>Results:</h3>
                
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className="margin-bottom--lg"
                    style={{
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <h4>{result.model}</h4>
                    
                    <div className="margin-bottom--md">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span><strong>Response Time:</strong> {(result.time / 1000).toFixed(2)}s</span>
                        <span><strong>Total Cost:</strong> ${formatCostScientific(result.costs.total)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.9em', color: '#666' }}>
                        <div>
                          <div>Prompt Tokens: {result.tokens.prompt}</div>
                          <div>Prompt Cost: ${formatCostScientific(result.costs.prompt)}</div>
                        </div>
                        <div>
                          <div>Completion Tokens: {result.tokens.completion}</div>
                          <div>Completion Cost: ${formatCostScientific(result.costs.completion)}</div>
                        </div>
                        <div>
                          <div>Total Tokens: {result.tokens.total}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '12px', 
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}
                    >
                      {result.response}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
