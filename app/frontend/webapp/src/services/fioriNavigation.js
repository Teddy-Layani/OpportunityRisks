// services/fioriNavigation.js - Vue 3 Compatible Version
import { ref, reactive } from 'vue'

export class FioriNavigationService {
    constructor() {
        // Vue 3 reactive state for tracking navigation status
        this.isNavigating = ref(false)
        this.lastError = ref(null)
        this.startupParams = reactive({})
        
        // Initialize startup parameters on creation
        this.initializeStartupParameters()
    }

    /**
     * Navigate to another Fiori app
     * @param {string} semanticObject - The semantic object (e.g., 'Opportunity')
     * @param {string} action - The action (e.g., 'display', 'manage')
     * @param {Object} parameters - Navigation parameters
     * @returns {Promise<boolean>} - Success status
     */
    async navigateToApp(semanticObject, action, parameters = {}) {
        try {
            this.isNavigating.value = true
            this.lastError.value = null

            // Check if we're in Fiori Launchpad environment
            if (!this.isFioriEnvironment()) {
                console.warn('Not in Fiori Launchpad environment - navigation skipped')
                return false
            }

            const navService = await window.sap.ushell.Container
                .getServiceAsync("CrossApplicationNavigation")

            await navService.toExternal({
                target: {
                    semanticObject: semanticObject,
                    action: action
                },
                params: parameters
            })

            return true
        } catch (error) {
            console.error('Fiori navigation failed:', error)
            this.lastError.value = error.message
            return false
        } finally {
            this.isNavigating.value = false
        }
    }

    /**
     * Navigate back in Fiori shell
     * @returns {Promise<boolean>}
     */
    async navigateBack() {
        try {
            if (!this.isFioriEnvironment()) {
                // Fallback to browser back if not in Fiori
                window.history.back()
                return true
            }

            const historyService = await window.sap.ushell.Container
                .getServiceAsync("ShellNavigation")
            
            historyService.hashChanger.replaceHash("")
            return true
        } catch (error) {
            console.error('Navigate back failed:', error)
            this.lastError.value = error.message
            return false
        }
    }

    /**
     * Extract startup parameters from Fiori Launchpad
     * @returns {Object} - Parsed startup parameters
     */
    extractStartupParameters() {
        try {
            // Method 1: Component data (traditional)
            const componentData = window.componentData
            if (componentData?.startupParameters) {
                return Object.keys(componentData.startupParameters).reduce((params, key) => {
                    const value = componentData.startupParameters[key]
                    params[key] = Array.isArray(value) ? value[0] : value
                    return params
                }, {})
            }

            // Method 2: URL parameters (modern approach)
            const urlParams = new URLSearchParams(window.location.search)
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            
            const params = {}
            
            // Combine URL and hash parameters
            urlParams.forEach((value, key) => {
                params[key] = value
            })
            
            hashParams.forEach((value, key) => {
                params[key] = value
            })

            // Method 3: Fiori shell startup parameters
            if (this.isFioriEnvironment() && window.sap.ushell.Container.getService) {
                try {
                    const appLifeCycle = window.sap.ushell.Container.getService("AppLifeCycle")
                    const currentApp = appLifeCycle.getCurrentApplication()
                    if (currentApp?.componentHandle?.getComponentData?.()?.startupParameters) {
                        const startupParams = currentApp.componentHandle.getComponentData().startupParameters
                        Object.keys(startupParams).forEach(key => {
                            const value = startupParams[key]
                            params[key] = Array.isArray(value) ? value[0] : value
                        })
                    }
                } catch (shellError) {
                    console.warn('Could not extract shell startup parameters:', shellError)
                }
            }

            return params
        } catch (error) {
            console.error('Failed to extract startup parameters:', error)
            return {}
        }
    }

    /**
     * Initialize startup parameters and store in reactive state
     */
    initializeStartupParameters() {
        const params = this.extractStartupParameters()
        Object.assign(this.startupParams, params)
    }

    /**
     * Check if running in Fiori Launchpad environment
     * @returns {boolean}
     */
    isFioriEnvironment() {
        return !!(window.sap?.ushell?.Container)
    }

    /**
     * Get current shell hash
     * @returns {string}
     */
    getCurrentShellHash() {
        if (this.isFioriEnvironment()) {
            try {
                return window.sap.ushell.Container.getService("ShellNavigation")
                    .hashChanger.getHash()
            } catch (error) {
                console.warn('Could not get shell hash:', error)
            }
        }
        return window.location.hash
    }

    /**
     * Set shell title (Vue 3 reactive way)
     * @param {string} title
     */
    setShellTitle(title) {
        if (this.isFioriEnvironment()) {
            try {
                window.sap.ushell.Container.getService("ShellNavigation")
                    .setTitle(title)
            } catch (error) {
                console.warn('Could not set shell title:', error)
            }
        }
        // Fallback to document title
        document.title = title
    }

    /**
     * Vue 3 Composition API helper - returns reactive navigation state
     * Use this in your Vue 3 components with the Composition API
     */
    useNavigationState() {
        return {
            isNavigating: this.isNavigating,
            lastError: this.lastError,
            startupParams: this.startupParams,
            isFioriEnvironment: this.isFioriEnvironment()
        }
    }
}

// Vue 3 Composable for Fiori Navigation
export function useFioriNavigation() {
    const navigationService = new FioriNavigationService()
    
    return {
        // Methods
        navigateToApp: navigationService.navigateToApp.bind(navigationService),
        navigateBack: navigationService.navigateBack.bind(navigationService),
        extractStartupParameters: navigationService.extractStartupParameters.bind(navigationService),
        setShellTitle: navigationService.setShellTitle.bind(navigationService),
        
        // Reactive state
        ...navigationService.useNavigationState(),
        
        // Utilities
        isFioriEnvironment: navigationService.isFioriEnvironment()
    }
}

// Default export for backward compatibility
export default FioriNavigationService