console.log('Environment keys:', Object.keys(process.env).filter(key => 
  key.toLowerCase().includes('db') || 
  key.toLowerCase().includes('database') || 
  key.toLowerCase().includes('postgres') ||
  key.toLowerCase().includes('url') ||
  key.toLowerCase().includes('key')
));
