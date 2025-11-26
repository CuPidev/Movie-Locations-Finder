import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    ChakraProvider,
    Input,
    Switch,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useToast,
} from "@chakra-ui/react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import chakraTheme from "./chakraTheme";
import ThemeSelector from "./components/ThemeSelector";
import BrowsePage from "./pages/BrowsePage";
import SearchPage from "./pages/SearchPage";

// Moved away demo component to keep App.tsx clean
function Demo() {
    const toast = useToast();
    {/* Chakra UI Demo Section */}
    return <Card
        mb={6}
        boxShadow="md"
        bg="var(--card-bg)"
        borderColor="var(--card-border)"
    >
        <CardHeader fontWeight="bold" fontSize="xl">
            Chakra UI Demo Card
        </CardHeader>
        <CardBody>
            <Box mb={4}>
                <Input
                    placeholder="Type something..."
                    size="md"
                    mb={2}
                    bg="var(--input-bg)"
                    color="var(--text)"
                    borderColor="var(--input-border)"
                />
                <Button
                    mr={2}
                    bg="var(--accent)"
                    color="var(--button-text)"
                    _hover={{ bg: "var(--accent-700)" }}
                >
                    Chakra Button
                </Button>
                <Switch
                    defaultChecked
                    mr={2}
                    sx={{
                        "& .chakra-switch__track": {
                            backgroundColor:
                                "var(--accent)",
                        },
                        "& .chakra-switch__thumb": {
                            backgroundColor:
                                "var(--card-bg)",
                        },
                    }}
                />
            </Box>
            <Button
                mb={4}
                bg="var(--accent)"
                color="var(--button-text)"
                _hover={{ bg: "var(--accent-700)" }}
                onClick={() =>
                    toast({
                        title: "Chakra Toast Demo!",
                        description:
                            "This is a toast notification.",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                        position: "top",
                    })
                }
            >
                Show Toast
            </Button>
            <Tabs variant="enclosed">
                <TabList>
                    <Tab>Tab 1</Tab>
                    <Tab>Tab 2</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        Content for Tab 1
                    </TabPanel>
                    <TabPanel>
                        Content for Tab 2
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </CardBody>
        <CardFooter>
            <Alert status="success" borderRadius="md">
                <AlertIcon />
                <AlertTitle mr={2}>Success!</AlertTitle>
                <AlertDescription>
                    This is a Chakra UI alert.
                </AlertDescription>
            </Alert>
        </CardFooter>
    </Card>
}


export default function App() {
    const toast = useToast();
    return (
        <HelmetProvider>
            <BrowserRouter>
                <ChakraProvider theme={chakraTheme}>
                    <Box minH="100vh">
                        <Box maxW="3xl" mx="auto" px={4} py={6}>
                            {/* Header */}
                            <Box as="header" mb={6}>
                                <Box
                                    as="h1"
                                    fontSize="3xl"
                                    fontWeight="semibold"
                                    color="var(--accent)"
                                    mb={2}
                                >
                                    🪨🎬Movie Filming Locations Finder
                                </Box>
                                <Box fontSize="sm" mb={2} color="var(--muted)">
                                    Search UNESCO World Heritage sites by
                                    keyword.
                                </Box>
                                <Box
                                    mt={3}
                                    mb={4}
                                    fontSize="sm"
                                    color="var(--muted)"
                                >
                                    Theme: <ThemeSelector />
                                </Box>
                                <Box mt={3}>
                                    <Box
                                        fontSize="sm"
                                        fontWeight="medium"
                                        mb={2}
                                        color="var(--muted)"
                                    >
                                        Authors — Team 19
                                    </Box>
                                    <Box
                                        as="ul"
                                        pl={5}
                                        fontSize="sm"
                                        color="var(--muted)"
                                    >
                                        <Box as="li">Mateusz Cupryniak</Box>
                                        <Box as="li">František Vlček</Box>
                                        <Box as="li">Vasyl Damian</Box>
                                    </Box>
                                </Box>
                            </Box>
                            {/* Routes */}
                            <Routes>
                                <Route path="/" element={<SearchPage />} />
                                <Route
                                    path="/browse"
                                    element={<BrowsePage />}
                                />
                                <Route
                                    path="/browse.html"
                                    element={<BrowsePage />}
                                />
                                <Route path="*" element={<SearchPage />} />
                            </Routes>
                        </Box>
                    </Box>
                </ChakraProvider>
            </BrowserRouter>
        </HelmetProvider>
    );
}
