"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const errorMessage = error?.message || "Unknown error";

      // Parse common errors
      const isSyntaxError =
        errorMessage.includes("Unexpected token") ||
        errorMessage.includes("SyntaxError");
      const isImportError =
        errorMessage.includes("Cannot find module") ||
        errorMessage.includes("does not provide an export");
      const isComponentError =
        errorMessage.includes("is not defined") ||
        errorMessage.includes("is not a function");

      return (
        <div className="h-full w-full flex items-center justify-center p-8 bg-muted/30">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Generated Code Error</CardTitle>
              </div>
              <CardDescription>
                The AI generated code has an error. This can happen sometimes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {isSyntaxError && "Syntax Error"}
                  {isImportError && "Missing Component Import"}
                  {isComponentError && "Component Error"}
                  {!isSyntaxError &&
                    !isImportError &&
                    !isComponentError &&
                    "Runtime Error"}
                </AlertTitle>
                <AlertDescription className="font-mono text-xs mt-2 whitespace-pre-wrap">
                  {errorMessage}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">What you can do:</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Try generating again with a simpler sketch</li>
                  <li>Add more details to your custom prompt</li>
                  <li>Check the code panel for the specific error</li>
                  {isImportError && (
                    <li className="text-orange-500">
                      Missing component detected - we'll try to install it
                      automatically
                    </li>
                  )}
                </ul>
              </div>

              {this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Technical Details (for debugging)
                  </summary>
                  <pre className="bg-muted p-4 rounded overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const codePanel = document.querySelector(
                      '[role="complementary"]',
                    );
                    codePanel?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="gap-2"
                >
                  <Code className="h-4 w-4" />
                  View Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
