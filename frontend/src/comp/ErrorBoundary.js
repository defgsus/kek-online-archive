import React from "react";


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null
        };
    }

    componentDidCatch(error, errorInfo) {
        let extra;
        if (errorInfo.componentStack)
            extra = errorInfo.componentStack;
        else
            content = JSON.stringify(errorInfo, null, 2);

        this.setState({error: {
            text: `${error}`,
            extra,
        }});
    }

    render() {
        if (this.state.error) {
            return (
                <div className={"error"}>
                    Exception: {this.state.error.text}
                    <pre>
                        {this.state.error.extra}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;