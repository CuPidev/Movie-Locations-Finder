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
import BrowsePage from "./pages/BrowsePage";
import SearchPage from "./pages/SearchPage";

export default function App() {
    const toast = useToast();
    return (
        <HelmetProvider>
            <BrowserRouter>
                <ChakraProvider>
                    <Box minH="100vh" bg="gray.50">
                        <Box maxW="3xl" mx="auto" px={4} py={6}>
                            {/* Chakra UI Demo Section */}
                            <Card mb={6} boxShadow="md">
                                <CardHeader fontWeight="bold" fontSize="xl">
                                    Chakra UI Demo Card
                                </CardHeader>
                                <CardBody>
                                    <Box mb={4}>
                                        <Input
                                            placeholder="Type something..."
                                            size="md"
                                            mb={2}
                                        />
                                        <Button colorScheme="teal" mr={2}>
                                            Chakra Button
                                        </Button>
                                        <Switch
                                            colorScheme="teal"
                                            defaultChecked
                                            mr={2}
                                        />
                                    </Box>
                                    <Button
                                        colorScheme="orange"
                                        mb={4}
                                        onClick={() =>
                                            toast({
                                                title: "Chakra Toast Demo!",
                                                description:
                                                    "This is a toast notification.",
                                                status: "success",
                                                duration: 3000,
                                                isClosable: true,
                                                position: "top-center",
                                            })
                                        }
                                    >
                                        Show Toast
                                    </Button>
                                    <Tabs variant="enclosed" colorScheme="teal">
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
                            {/* Header */}
                            <Box as="header" mb={6}>
                                <Box
                                    as="h1"
                                    fontSize="3xl"
                                    fontWeight="semibold"
                                    mb={2}
                                >
                                    🪨🎬Movie Filming Locations Finder
                                </Box>
                                <Box fontSize="sm" mb={2} color="gray.500">
                                    Search UNESCO World Heritage sites by
                                    keyword.
                                </Box>
                                <Box
                                    mt={3}
                                    mb={4}
                                    fontSize="sm"
                                    color="gray.500"
                                >
                                    Theme:{" "}
                                    <Button size="sm">ThemeSelector</Button>
                                </Box>
                                <Box mt={3}>
                                    <Box
                                        fontSize="sm"
                                        fontWeight="medium"
                                        mb={2}
                                        color="gray.500"
                                    >
                                        Authors — Team 19
                                    </Box>
                                    <Box
                                        as="ul"
                                        pl={5}
                                        fontSize="sm"
                                        color="gray.500"
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
