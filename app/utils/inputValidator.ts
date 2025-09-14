// Input validation and type detection utilities

export interface InputValidation {
  type: 'transaction' | 'block' | 'address' | 'invalid';
  value: string;
  normalized?: string;
}

export function validateAndDetectInput(input: string): InputValidation {
  const cleanInput = input.trim();
  
  if (!cleanInput) {
    return { type: 'invalid', value: cleanInput };
  }

  // Check for transaction hash (64 hex characters with 0x prefix)
  if (/^0x[a-fA-F0-9]{64}$/.test(cleanInput)) {
    return { 
      type: 'transaction', 
      value: cleanInput,
      normalized: cleanInput.toLowerCase()
    };
  }

  // Check for block number (decimal number or hex with 0x prefix)
  if (/^[0-9]+$/.test(cleanInput)) {
    return { 
      type: 'block', 
      value: cleanInput,
      normalized: cleanInput
    };
  }
  
  if (/^0x[a-fA-F0-9]+$/.test(cleanInput) && cleanInput.length <= 12) {
    return { 
      type: 'block', 
      value: cleanInput,
      normalized: parseInt(cleanInput, 16).toString()
    };
  }

  // Check for Ethereum address (42 hex characters with 0x prefix)
  if (/^0x[a-fA-F0-9]{40}$/.test(cleanInput)) {
    return { 
      type: 'address', 
      value: cleanInput,
      normalized: cleanInput.toLowerCase()
    };
  }

  // Check for ENS domain (contains . and ends with .eth or other TLD)
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanInput)) {
    return { 
      type: 'address', 
      value: cleanInput,
      normalized: cleanInput.toLowerCase()
    };
  }

  return { type: 'invalid', value: cleanInput };
}

export function formatInputForDisplay(validation: InputValidation): string {
  switch (validation.type) {
    case 'transaction':
      return `Transaction Hash: ${validation.value}`;
    case 'block':
      return `Block Number: ${validation.normalized || validation.value}`;
    case 'address':
      return `Address: ${validation.value}`;
    default:
      return 'Invalid input format';
  }
}

export function getInputTypeDescription(type: string): string {
  switch (type) {
    case 'transaction':
      return 'AI-powered transaction analysis with gas optimization and security assessment';
    case 'block':
      return 'Block information with transaction details and network metrics';
    case 'address':
      return 'Address analysis including AVAX balance, activity patterns, and contract details';
    default:
      return 'Please enter a valid transaction hash (0x...), block number, or address';
  }
}