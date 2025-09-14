// Helper functions for Mermaid diagram validation and cleaning
export function validateMermaidDiagram(diagram: string): { isValid: boolean; errors: string[]; cleaned?: string } {
  const errors: string[] = [];
  let cleaned = diagram;

  // Remove problematic patterns
  const problematicPatterns = [
    /<br\s*\/?>/gi,  // Remove <br> tags
    /\n\s*\n/g,      // Remove multiple newlines
    /[^\x00-\x7F]/g, // Remove non-ASCII characters that might cause issues
  ];

  // Clean the diagram
  problematicPatterns.forEach(pattern => {
    if (pattern.test(cleaned)) {
      errors.push(`Found problematic pattern: ${pattern}`);
      cleaned = cleaned.replace(pattern, ' ');
    }
  });

  // Check for common Mermaid syntax issues
  const lines = cleaned.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('%%')) continue;
    
    // Check for unbalanced brackets in node definitions
    if (line.includes('[') && line.includes(']')) {
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push(`Line ${i + 1}: Unbalanced brackets in node definition`);
      }
    }
    
    // Check for proper edge syntax
    if (line.includes('-->') || line.includes('---')) {
      // Validate edge labels are properly quoted
      const edgeLabelMatch = line.match(/\|([^|]+)\|/);
      if (edgeLabelMatch) {
        const label = edgeLabelMatch[1];
        if (!label.startsWith('"') || !label.endsWith('"')) {
          // Auto-fix: add quotes around edge labels
          cleaned = cleaned.replace(edgeLabelMatch[0], `|"${label.replace(/"/g, '')}"|`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleaned: errors.length > 0 ? cleaned : undefined
  };
}

export function createSimpleMermaidDiagram(
  transactionData: any,
  transfers: any[],
  usdValues: any
): string {
  // Create a simple, guaranteed-to-work Mermaid diagram
  const fromAddress = transactionData.from ? 
    `${transactionData.from.substring(0, 6)}...${transactionData.from.substring(38)}` : 
    'Unknown';
  
  const toAddress = transactionData.to ? 
    `${transactionData.to.substring(0, 6)}...${transactionData.to.substring(38)}` : 
    'Contract Creation';

  const totalValue = usdValues?.total || 0;
  const gasUSD = usdValues?.fees || 0;
  const gasAVAX = transactionData.actualFee ? 
    (Number(transactionData.actualFee) / 1e18).toFixed(4) : 
    '0';

  const diagram = `graph LR
    classDef wallet fill:#F3E8FF,stroke:#8B008B,stroke-width:2px;
    classDef contract fill:#FEE2E2,stroke:#DC143C,stroke-width:2px;
    
    A[From: ${fromAddress}]:::wallet
    B[To: ${toAddress}]:::contract
    
    A -->|"$${totalValue.toFixed(2)} + $${gasUSD.toFixed(2)} gas"| B`;

  return diagram;
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function createTransferFlowDiagram(transfers: any[], usdValues: any): string {
  try {
    if (!transfers || transfers.length === 0) {
      return createSimpleMermaidDiagram({}, [], usdValues);
    }

    let diagram = `graph LR
    classDef wallet fill:#F3E8FF,stroke:#8B008B,stroke-width:2px;
    classDef contract fill:#FEE2E2,stroke:#DC143C,stroke-width:2px;
    classDef token fill:#E6FFFA,stroke:#14B8A6,stroke-width:2px;
    
`;

    // Create nodes for unique addresses
    const addresses = new Set();
    transfers.forEach(transfer => {
      if (transfer.from) addresses.add(transfer.from);
      if (transfer.to) addresses.add(transfer.to);
    });

    const addressMap = new Map();
    Array.from(addresses).forEach((addr, index) => {
      const nodeId = String.fromCharCode(65 + index); // A, B, C, etc.
      const shortAddr = shortenAddress(addr as string);
      addressMap.set(addr, nodeId);
      diagram += `    ${nodeId}["${shortAddr}"]:::wallet\n`;
    });

    // Create edges for transfers
    transfers.forEach((transfer, index) => {
      const fromNode = addressMap.get(transfer.from);
      const toNode = addressMap.get(transfer.to);
      
      if (fromNode && toNode && fromNode !== toNode) {
        const amount = transfer.value ? parseFloat(transfer.value) : 0;
        const symbol = transfer.token?.symbol || 'Token';
        
        // Format amount safely
        let formattedAmount = '0';
        if (amount > 0) {
          if (amount > 1000000) {
            formattedAmount = (amount / 1000000).toFixed(1) + 'M';
          } else if (amount > 1000) {
            formattedAmount = (amount / 1000).toFixed(1) + 'K';
          } else {
            formattedAmount = amount.toFixed(2);
          }
        }
        
        diagram += `    ${fromNode} -->|"${formattedAmount} ${symbol}"| ${toNode}\n`;
      }
    });

    return diagram;
  } catch (error) {
    console.error('Error creating transfer flow diagram:', error);
    // Return a simple fallback diagram
    return `graph LR
    classDef wallet fill:#F3E8FF,stroke:#8B008B,stroke-width:2px;
    
    A["Transaction"]:::wallet
    B["Complete"]:::wallet
    
    A -->|"Success"| B`;
  }
}