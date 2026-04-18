// JSON Tree Viewer Component
class JSONTreeViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
        }
    }

    render(jsonString) {
        if (!this.container) return;

        try {
            const data = JSON.parse(jsonString);
            this.container.innerHTML = '';
            
            const tree = document.createElement('div');
            tree.className = 'json-tree';
            tree.appendChild(this.createNode(data, 'root', true));
            
            this.container.appendChild(tree);
        } catch (error) {
            this.container.innerHTML = '<p class="tree-error">Invalid JSON - Cannot generate tree view</p>';
        }
    }

    createNode(value, key, isRoot = false) {
        const node = document.createElement('div');
        node.className = 'tree-node';

        const content = document.createElement('div');
        content.className = 'tree-content';

        const type = this.getType(value);
        let label = isRoot ? 'root' : key;
        let isExpandable = type === 'object' || type === 'array';

        // Create the toggle + label
        const header = document.createElement('div');
        header.className = 'tree-header';

        if (isExpandable) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle expanded';
            toggle.textContent = '▼';
            toggle.style.cursor = 'pointer';
            header.appendChild(toggle);

            header.addEventListener('click', (e) => {
                if (e.target === toggle) {
                    const body = node.querySelector('.tree-body');
                    const isExpanded = body.style.display !== 'none';
                    body.style.display = isExpanded ? 'none' : 'block';
                    toggle.classList.toggle('expanded');
                    toggle.textContent = isExpanded ? '▶' : '▼';
                }
            });
        } else {
            const space = document.createElement('span');
            space.className = 'tree-space';
            space.textContent = '  ';
            header.appendChild(space);
        }

        // Create label (clickable to copy)
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tree-key tree-copyable';
        labelSpan.textContent = isRoot ? '' : label;
        labelSpan.title = `Click to copy: "${label}"`;
        labelSpan.style.cursor = 'pointer';
        
        if (!isRoot) {
            labelSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(label);
            });
        }
        
        header.appendChild(labelSpan);

        // Add type/value indicator
        if (!isExpandable) {
            const colon = document.createElement('span');
            colon.className = 'tree-colon';
            colon.textContent = ': ';
            header.appendChild(colon);

            const valueSpan = document.createElement('span');
            valueSpan.className = `tree-value tree-${type} tree-copyable`;
            valueSpan.textContent = this.formatValue(value);
            valueSpan.title = `Click to copy value`;
            valueSpan.style.cursor = 'pointer';
            
            valueSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(String(value));
            });
            
            header.appendChild(valueSpan);
        } else {
            const summary = document.createElement('span');
            summary.className = 'tree-summary';
            
            if (type === 'array') {
                summary.textContent = ` [${value.length} items]`;
            } else {
                const keys = Object.keys(value).length;
                summary.textContent = ` {${keys} properties}`;
            }
            header.appendChild(summary);
        }

        content.appendChild(header);
        node.appendChild(content);

        // Create expandable body if needed
        if (isExpandable) {
            const body = document.createElement('div');
            body.className = 'tree-body';

            if (type === 'array') {
                value.forEach((item, index) => {
                    body.appendChild(this.createNode(item, `[${index}]`));
                });
            } else {
                Object.keys(value).forEach((key) => {
                    body.appendChild(this.createNode(value[key], key));
                });
            }

            node.appendChild(body);
        }

        return node;
    }

    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'object') return 'object';
        return 'unknown';
    }

    formatValue(value) {
        const type = this.getType(value);
        
        if (type === 'string') {
            return `"${String(value).substring(0, 100)}${String(value).length > 100 ? '...' : ''}"`;
        }
        if (type === 'number') {
            return String(value);
        }
        if (type === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (type === 'null') {
            return 'null';
        }
        return String(value).substring(0, 50);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show copy confirmation
            this.showCopyMessage('✓ Copied: ' + (text.length > 30 ? text.substring(0, 30) + '...' : text));
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    showCopyMessage(message) {
        // Create temporary message
        const msg = document.createElement('div');
        msg.className = 'tree-copy-message';
        msg.textContent = message;
        document.body.appendChild(msg);
        
        // Remove after 2 seconds
        setTimeout(() => {
            msg.remove();
        }, 2000);
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '<p class="tree-placeholder">Tree view will appear here...</p>';
        }
    }
}
