import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './components/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Assuming lucide-react is installed for icons, if not, this import will fail
// import { Sun, Moon } from 'lucide-react';
import * as api from './services/api';

function AppContent() {
  const { theme, setTheme } = useTheme();

  const [quickSearchCardName, setQuickSearchCardName] = useState('');
  const [fullSearchCardList, setFullSearchCardList] = useState('');
  const [scrapeResults, setScrapeResults] = useState([]);
  const [deckCostAnalysisResult, setDeckCostAnalysisResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeError, setActiveError] = useState('');


  const [config, setConfig] = useState({
    ALLOW_FOIL: false,
    ALLOW_OUT_OF_STOCK: false,
    IS_F2F_SCRAPE: true,
    IS_WIZ_SCRAPE: true,
    IS_401_SCRAPE: true,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        addLog('Fetching initial configuration...');
        const fetchedConfig = await api.getConfig();
        setConfig(fetchedConfig);
        addLog('Configuration loaded successfully.');
      } catch (error) {
        handleApiError(error, 'fetching config');
      }
    };
    fetchConfig();
  }, []);

  const addLog = (message) => {
    setLogs(prevLogs => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLogs.slice(0, 99)]);
  };

  const handleApiError = (error, context = 'API call') => {
    const errorMessage = `Error ${context}: ${error.message}`;
    addLog(errorMessage);
    setActiveError(errorMessage); // Display prominent error
    console.error(errorMessage, error);
    // Hide error message after some time
    setTimeout(() => setActiveError(''), 5000);
  }

  const handleQuickSearch = async () => {
    if (!quickSearchCardName.trim()) {
      addLog('Quick Search: Card name is empty.');
      return;
    }
    addLog(`Quick Search started for: "${quickSearchCardName}"`);
    setIsLoading(true);
    setScrapeResults([]);
    setDeckCostAnalysisResult(null);
    setActiveError('');
    try {
      const result = await api.scrapeQuick(quickSearchCardName.trim());
      addLog(`Quick Search for "${quickSearchCardName}" completed. Found ${result.data.length} items.`);
      setScrapeResults(result.data);
    } catch (error) {
      handleApiError(error, `quick searching for "${quickSearchCardName}"`);
    }
    setIsLoading(false);
  };

  const handleFullSearch = async () => {
    const cardListArray = fullSearchCardList.split('\n').map(name => name.trim()).filter(name => name);
    if (cardListArray.length === 0) {
      addLog('Full Search: Card list is empty.');
      return;
    }
    addLog(`Full Search started for ${cardListArray.length} cards.`);
    setIsLoading(true);
    setScrapeResults([]);
    setDeckCostAnalysisResult(null);
    setActiveError('');
    try {
      const result = await api.scrapeFull(cardListArray);
      addLog(`Full Search completed. Found ${result.data.length} total items.`);
      setScrapeResults(result.data);
    } catch (error) {
      handleApiError(error, 'full searching');
    }
    setIsLoading(false);
  };

  const handleDeckCostAnalysis = async () => {
    if (scrapeResults.length === 0) {
      addLog('Deck Cost Analysis: No scraped data available to analyze.');
      return;
    }
    addLog('Deck Cost Analysis started...');
    setIsLoading(true);
    setDeckCostAnalysisResult(null);
    setActiveError('');
    try {
      const analysis = await api.analyzeDeckCost(scrapeResults);
      addLog(`Deck Cost Analysis completed. Total minimum cost: $${analysis.totalCost}. Unique cards: ${analysis.uniqueCardCount}.`);
      setDeckCostAnalysisResult(analysis);
    } catch (error) {
      handleApiError(error, 'analyzing deck cost');
    }
    setIsLoading(false);
  };

  const handleConfigChange = async (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setActiveError('');
    try {
      addLog(`Updating config: ${key} = ${value}`);
      await api.updateConfig({ [key]: value });
      addLog('Configuration updated successfully on backend.');
    } catch (error) {
      handleApiError(error, 'updating config');
      // Revert config on error
      addLog('Reverting config change due to backend error.');
      const oldConfig = await api.getConfig().catch(() => config); // Fallback to current state on error
      setConfig(oldConfig);
    }
  };

  const ThemeToggleButton = () => (
     <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {/* Using text as lucide-react might not be available or subtask might fail to install it */}
        {theme === 'light' ? 'Dk' : 'Lt'}
        {/* <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /> */}
        <span className="sr-only">Toggle theme</span>
      </Button>
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">MTG Card Scraper</h1>
        <ThemeToggleButton />
      </header>

      {activeError && (
        <Card className="mb-4 bg-destructive text-destructive-foreground p-4">
            <CardContent className="p-0">
                <p className="font-semibold">Error:</p>
                <p>{activeError}</p>
            </CardContent>
        </Card>
      )}

      <Tabs defaultValue="run" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="run">Run Scrapers</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scrape Card Data</CardTitle>
              <CardDescription>Enter card names to search across enabled retailers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="quickSearch" className="text-base">Quick Search (Single Card)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="quickSearch"
                    placeholder="e.g., Sol Ring"
                    value={quickSearchCardName}
                    onChange={(e) => setQuickSearchCardName(e.target.value)}
                    disabled={isLoading}
                    className="text-base"
                  />
                  <Button onClick={handleQuickSearch} disabled={isLoading} size="lg">
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="fullSearch" className="text-base">Full Search (List of Cards, one per line)</Label>
                <Textarea
                  id="fullSearch"
                  placeholder="Sol Ring\nLightning Bolt\n..."
                  value={fullSearchCardList}
                  onChange={(e) => setFullSearchCardList(e.target.value)}
                  rows={5}
                  disabled={isLoading}
                  className="text-base"
                />
                <Button onClick={handleFullSearch} disabled={isLoading} className="mt-2" size="lg">
                  {isLoading ? 'Searching List...' : 'Search List'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {deckCostAnalysisResult && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Deck Cost Analysis</CardTitle></CardHeader>
              <CardContent>
                <p className="text-lg">Total Minimum Deck Cost: <span className="font-bold text-green-600">${deckCostAnalysisResult.totalCost.toFixed(2)}</span></p>
                <p className="text-sm text-muted-foreground">Based on {deckCostAnalysisResult.uniqueCardCount} unique cards found from {deckCostAnalysisResult.totalCardsProcessed} scraped listings.</p>
                <ScrollArea className="h-40 w-full rounded-md border p-2 mt-2">
                    <p className="font-semibold mb-1">Cheapest versions used:</p>
                    {deckCostAnalysisResult.cheapestCards.map((card, index) => (
                        <div key={index} className="text-xs mb-1">
                           {card.card_name} ({card.retailer}): ${card.price.toFixed(2)} ({card.condition || 'N/A'}, {card.is_foil ? "Foil" : "Non-Foil"})
                        </div>
                    ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle>Results <span className="text-sm font-normal text-muted-foreground">({scrapeResults.length} items)</span></CardTitle>
                {scrapeResults.length > 0 && (
                    <Button onClick={handleDeckCostAnalysis} disabled={isLoading || scrapeResults.length === 0} variant="outline">
                        Analyze Deck Cost
                    </Button>
                )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                {isLoading && <p className="text-center p-4">Loading results...</p>}
                {!isLoading && scrapeResults.length === 0 && <p className="text-center p-4 text-muted-foreground">No results yet. Run a search.</p>}
                {!isLoading && scrapeResults.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Set</TableHead>
                        <TableHead>Retailer</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Cond.</TableHead>
                        <TableHead>Foil</TableHead>
                        <TableHead>Frame</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scrapeResults.map((card, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{card.card_name}</TableCell>
                          <TableCell>{card.card_set}</TableCell>
                          <TableCell>{card.retailer}</TableCell>
                          <TableCell className="text-right">${card.price.toFixed(2)}</TableCell>
                          <TableCell>{card.stock}</TableCell>
                          <TableCell>{card.condition || 'N/A'}</TableCell>
                          <TableCell>{card.is_foil ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{card.frame || 'N/A'}</TableCell>
                          <TableCell>
                            {card.link && <Button variant="link" size="sm" asChild><a href={card.link} target="_blank" rel="noopener noreferrer">View</a></Button>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure scraper behavior and retailer options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Config items remain the same as before */}
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label htmlFor="allowFoil" className="flex flex-col space-y-1 cursor-pointer">
                  <span>Allow Foil Cards</span>
                  <span className="font-normal leading-snug text-muted-foreground text-sm">
                    Include foil versions of cards in results.
                  </span>
                </Label>
                <Switch
                  id="allowFoil"
                  checked={config.ALLOW_FOIL}
                  onCheckedChange={(value) => handleConfigChange('ALLOW_FOIL', value)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label htmlFor="allowOOS" className="flex flex-col space-y-1 cursor-pointer">
                  <span>Allow Out of Stock</span>
                   <span className="font-normal leading-snug text-muted-foreground text-sm">
                    Include cards that are currently out of stock.
                  </span>
                </Label>
                <Switch
                  id="allowOOS"
                  checked={config.ALLOW_OUT_OF_STOCK}
                  onCheckedChange={(value) => handleConfigChange('ALLOW_OUT_OF_STOCK', value)}
                />
              </div>
              <Separator />
              <h3 className="text-lg font-medium pt-2">Retailers</h3>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label htmlFor="enableF2F" className="cursor-pointer">FaceToFace Games</Label>
                <Switch
                  id="enableF2F"
                  checked={config.IS_F2F_SCRAPE}
                  onCheckedChange={(value) => handleConfigChange('IS_F2F_SCRAPE', value)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label htmlFor="enableWIZ" className="cursor-pointer">Wizards Tower</Label>
                <Switch
                  id="enableWIZ"
                  checked={config.IS_WIZ_SCRAPE}
                  onCheckedChange={(value) => handleConfigChange('IS_WIZ_SCRAPE', value)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label htmlFor="enable401G" className="cursor-pointer">401 Games</Label>
                <Switch
                  id="enable401G"
                  checked={config.IS_401_SCRAPE}
                  onCheckedChange={(value) => handleConfigChange('IS_401_SCRAPE', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader><CardTitle>Logs</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-48 w-full rounded-md border p-3 text-sm">
            {logs.map((log, index) => <p key={index} className="mb-1 font-mono">{log}</p>)}
            {logs.length === 0 && <p className="text-muted-foreground">No logs yet.</p>}
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
