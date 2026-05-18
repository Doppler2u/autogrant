import { useState, useEffect } from 'react'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { Globe, Zap, ShieldCheck, Cpu, ArrowRight, CheckCircle2, Loader2, XCircle, Wallet } from 'lucide-react'
import './App.css'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  
  // State machine for UI flow
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [submitTx, setSubmitTx] = useState('')
  const [evalTx, setEvalTx] = useState('')
  
  const [result, setResult] = useState<{score: number, feedback: string, is_approved: boolean} | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const CONTRACT_ADDRESS = '0x78a3C98826C3bb26F20eD13EF95035afD682181f'

  const switchNetwork = async () => {
    const chainIdHex = '0xf22f' // 61999 in hex
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: 'GenLayer Studio Network',
                nativeCurrency: {
                  name: 'GEN Token',
                  symbol: 'GEN',
                  decimals: 18,
                },
                rpcUrls: ['https://studio.genlayer.com/api'],
                blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
              },
            ],
          })
        } catch (addError: any) {
          throw new Error('Failed to add the GenLayer Studio network to your wallet.')
        }
      } else {
        throw new Error('Failed to switch to the GenLayer Studio network.')
      }
    }
  }

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask or another injected Web3 wallet.")
      }
      await switchNetwork()
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
      setWalletAddress(accounts[0])
    } catch (e: any) {
      setErrorMsg(e.message)
    }
  }

  const handleSubmit = async () => {
    if (!githubUrl || !projectUrl || !walletAddress) return
    setErrorMsg('')
    setResult(null)
    setSubmitTx('')
    setEvalTx('')
    setStep(1)

    try {
      await switchNetwork()

      const client = createClient({
        chain: studionet,
        provider: (window as any).ethereum,
        account: walletAddress as any,
      })

      const appId = `${walletAddress}_${githubUrl}`.toLowerCase()

      // Check if application already exists
      let existingApp: any = null
      try {
        existingApp = await client.readContract({
          address: CONTRACT_ADDRESS as any,
          functionName: 'get_application',
          args: [appId],
        }) as any
      } catch (_) {
        // Application doesn't exist yet — proceed to submit
      }

      if (existingApp?.is_evaluated) {
        // Already evaluated — just show the stored result
        setResult({ score: existingApp.score, feedback: existingApp.feedback, is_approved: existingApp.is_approved })
        setStep(3)
        return
      }

      if (!existingApp) {
        // 1. Submit Application
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESS as any,
          functionName: 'submit_application',
          args: [githubUrl, projectUrl],
          value: 0n,
        })
        setSubmitTx(hash)
      }
      setStep(2)

      // 2. Trigger Evaluation
      const evalHash = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'evaluate_application',
        args: [appId],
        value: 0n,
      })
      setEvalTx(evalHash)

      // Wait for the consensus network to finalize the execution
      await client.waitForTransactionReceipt({
        hash: evalHash,
        status: 'ACCEPTED',
        retries: 200,
      })

      // Read final state from contract
      const res = await client.readContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'get_application',
        args: [appId],
      }) as any

      setResult({
        score: res.score,
        feedback: res.feedback,
        is_approved: res.is_approved
      })
      setStep(3)

    } catch (error: any) {
      console.error(error)
      setErrorMsg(error.message || "An error occurred during transaction.")
      setStep(0)
    }
  }

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <Cpu className="logo-icon" size={28} />
          AutoGrant
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div 
            className="network-badge" 
            onClick={switchNetwork}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            title="Click to switch network"
          >
            <span className="dot"></span>
            GenLayer Studionet
          </div>
          
          {walletAddress ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}
              </div>
              <button 
                onClick={() => setWalletAddress('')}
                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Disconnect Wallet"
              >
                <XCircle size={16} />
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={16} /> Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main>
        <div className="hero">
          <h1>Onchain Grants.<br />AI Adjudicated.</h1>
          <p>Submit your open-source project. GenLayer's AI consensus evaluates your GitHub and live product to automatically stream your grant on Base.</p>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h2><Zap size={20} className="logo-icon"/> Submit Application</h2>
            </div>

            {/* Quick-fill demo presets */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Quick Test</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setGithubUrl('https://github.com/genlayerlabs/genvm'); setProjectUrl('https://genlayer.com') }}
                  disabled={step === 1 || step === 2}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--primary)', background: 'rgba(139,92,246,0.1)', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  🚀 GenLayer (High Impact)
                </button>
                <button
                  onClick={() => { setGithubUrl('https://github.com/octocat/Hello-World'); setProjectUrl('https://octocat.github.io') }}
                  disabled={step === 1 || step === 2}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  👾 Hello World (Low Impact)
                </button>
              </div>
            </div>
            
            <div className="input-group">
              <label>GitHub Repository</label>
              <div style={{ position: 'relative' }}>
                <Globe size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }}/>
                <input 
                  type="text" 
                  placeholder="https://github.com/your/repo" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={step > 0}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Live Product URL</label>
              <div style={{ position: 'relative' }}>
                <Globe size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }}/>
                <input 
                  type="text" 
                  placeholder="https://yourproject.com" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  disabled={step > 0}
                />
              </div>
            </div>

            {errorMsg && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{errorMsg}</p>}

            {!walletAddress ? (
              <button className="btn-submit" onClick={connectWallet}>
                Connect Wallet to Apply
              </button>
            ) : (
              <button 
                className="btn-submit" 
                onClick={handleSubmit}
                disabled={(step === 1 || step === 2) || !githubUrl || !projectUrl}
              >
                {(step === 1 || step === 2) ? (
                  <><Loader2 size={18} className="animate-spin"/> Processing...</>
                ) : (
                  <>Submit for Evaluation <ArrowRight size={18}/></>
                )}
              </button>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2><ShieldCheck size={20} className="logo-icon"/> Consensus Status</h2>
            </div>

            <div className="status-list">
              <div className={`status-item ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                <div className="status-icon">
                  {step > 1 ? <CheckCircle2 size={16}/> : <Cpu size={16}/>}
                </div>
                <div className="status-content">
                  <h3>1. Register Application</h3>
                  <p>Commit URL inputs to GenLayer.</p>
                  {submitTx && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <a href={`https://explorer-studio.genlayer.com/transactions/${submitTx}`} target="_blank" rel="noreferrer" className="tx-hash" style={{textDecoration: 'none', display: 'inline-block'}}>
                        {submitTx.slice(0,10)}...{submitTx.slice(-8)} ↗
                      </a>
                      <span
                        title="If the explorer shows an error like 'Application already submitted', that is expected — your application was registered in a previous session and is already stored on-chain."
                        style={{ cursor: 'help', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >i</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`status-item ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
                <div className="status-icon">
                  {step > 2 ? <CheckCircle2 size={16}/> : <Cpu size={16}/>}
                </div>
                <div className="status-content">
                  <h3>2. AI Consensus Evaluation</h3>
                  <p>Validators fetching web data and scoring impact.</p>
                  {evalTx && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <a href={`https://explorer-studio.genlayer.com/transactions/${evalTx}`} target="_blank" rel="noreferrer" className="tx-hash" style={{textDecoration: 'none', display: 'inline-block'}}>
                        {evalTx.slice(0,10)}...{evalTx.slice(-8)} ↗
                      </a>
                      <span
                        title="If the explorer shows an error like 'Application already evaluated', that is expected — this application was already scored by the AI in a previous session. The result below is the final stored consensus."
                        style={{ cursor: 'help', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >i</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`status-item ${step === 3 ? 'done' : ''}`}>
                <div className="status-icon">
                  {result?.is_approved ? <CheckCircle2 size={16}/> : (step === 3 ? <XCircle size={16}/> : <ShieldCheck size={16}/>)}
                </div>
                <div className="status-content">
                  <h3>3. Outcome Settlement</h3>
                  <p>Cross-chain unlock on Base Sepolia.</p>
                </div>
              </div>
            </div>

            {step === 3 && result && (
              <div className={`result-box ${result.is_approved ? 'approved' : 'rejected'}`}>
                <h3>Consensus Reached</h3>
                <div className="score">{result.score}<span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>/100</span></div>
                <p style={{ fontWeight: 500, color: result.is_approved ? 'var(--success)' : 'var(--error)', marginBottom: '1rem' }}>
                  {result.is_approved ? '✓ Approved for Grant' : '✗ Did not meet criteria'}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  "{result.feedback}"
                </p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default App
