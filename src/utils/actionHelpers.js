export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

export const getActionText = (action) => {
  switch (action.type) {
    case 'ADD': return `Added item: "${action.content}"`;
    case 'REMOVE': return `Removed item: "${action.content}"`;
    case 'SELECT': return `Selected item: "${action.content}"`;
    default: return `Unknown action on: "${action.content}"`;
  }
};
