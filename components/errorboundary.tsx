import React from "react";
import { View, Text, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to your crash reporting service here if you add one later
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "#D8F3DC" }}
        >
          <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

          <Text
            className="text-xl font-bold text-center mb-2"
            style={{ color: "#1B4332" }}
          >
            Something went wrong
          </Text>
          <Text
            className="text-sm text-center mb-6"
            style={{ color: "#40916C" }}
          >
            Please try again. If the problem continues, restart the app.
          </Text>

          <Pressable
            onPress={this.handleReset}
            className="rounded-full py-4 px-8 items-center"
            style={{ backgroundColor: "#40916C" }}
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </Pressable>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}