import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    styles: {
        global: {
            body: {
                bg: "var(--bg)",
                color: "var(--text)",
            },
        },
    },
    components: {
        Button: {
            baseStyle: {},
            variants: {
                solid: {
                    bg: "var(--accent)",
                    color: "var(--button-text)",
                    _hover: { bg: "var(--accent-700)" },
                },
                outline: {
                    borderColor: "var(--input-border)",
                    color: "var(--text)",
                },
                link: {
                    color: "var(--accent)",
                },
            },
            defaultProps: { variant: "solid" },
        },
        Input: {
            baseStyle: {
                field: {
                    bg: "var(--input-bg)",
                    color: "var(--text)",
                    borderColor: "var(--input-border)",
                },
            },
        },
        Select: {
            baseStyle: {
                field: {
                    bg: "var(--input-bg)",
                    color: "var(--text)",
                    borderColor: "var(--input-border)",
                },
            },
        },
        Card: {
            baseStyle: {
                container: {
                    bg: "var(--card-bg)",
                    borderColor: "var(--card-border)",
                },
            },
        },
        Alert: {
            baseStyle: {
                container: {
                    bg: "var(--card-bg)",
                    color: "var(--text)",
                    borderColor: "var(--card-border)",
                },
            },
        },
        Tabs: {
            baseStyle: {
                tab: {
                    color: "var(--text)",
                    _selected: {
                        bg: "var(--accent)",
                        color: "var(--button-text)",
                    },
                },
                tablist: {
                    borderColor: "var(--input-border)",
                },
            },
        },
        Switch: {
            baseStyle: {
                track: {
                    bg: "var(--input-border)",
                    _checked: { bg: "var(--accent)" },
                },
                thumb: { bg: "var(--card-bg)" },
            },
        },
    },
});

export default theme;
