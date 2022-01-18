import React from 'react'
import ReactDOM from 'react-dom'
import './index.scss'
import App from './comp/App'
import { store } from './store'
import { Provider } from 'react-redux'


window.addEventListener('DOMContentLoaded', () => {

    ReactDOM.render(
        <Provider store={store}>
            <App />
        </Provider>,
        document.getElementById('app')
    );

});