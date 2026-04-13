/**
 * servidor mcp mínimo para transporte de testes de integração
 * 
 * gerado como um processo child por mcp-stdio-transport.test.ts
 * 
 * rodar com: node mcp-stdio-server.mjs
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// png transparente 1x1 em base64 (menor png válido)
const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const server = new Server({
    name: 'test-stdio-server',
    version: '1.0.0'
}, {
    capabilities: {
        tools: {}
    }
});

server.setRequestHandler(ListToolsRequestSchema, async() => ({
    tools: [{
        name: 'echo',
        description: 'ecoa a mensagem de volta',

        inputSchema: {
            type: 'object',

            properties: {
                message: {
                    type: 'string',
                    description: 'mensagem a ser ecoada'
                }
            },

            required: ['message']
        }
    }, {
        name: 'add',
        description: 'adiciona dois números juntos',

        inputSchema: {
            type: 'object',

            properties: {
                a: { type: 'number', description: 'primeiro número' },
				b: { type: 'number', description: 'segundo número' }
            },

            required: [
                'a',
                'b'
            ]
        }
    }, {
        name: 'image',
        description: 'retorna uma pequena imagem com uma captação',

        inputSchema: {
            type: 'object',

            properties: {
                caption: {
                    type: 'string',
                    description: 'captação da imagem'
                }
            },

            required: ['caption']
        }
    }]
}));

server.setRequestHandler(CallToolRequestSchema, async(request) => {
    const { name, arguments: args = {} } = request.params;

    if (name === 'echo') {
        return {
            content: [{
                type: 'text',

                text: String(args.message ?? '')
            }]
        };
    }

    if (name === 'add') {
        const sum = Number(args.a ?? 0) + Number(args.b ?? 0);

        return {
            content: [{
                type: 'text',
                text: String(sum)
            }]
        };
    }

    if (name === 'image') {
        return {
            content: [
                { type: 'text', text: String(args.caption ?? '') },
				{ type: 'image', data: TINY_PNG, mimeType: 'image/png' }
            ]
        };
    }

    return {
        isError: true,

        content: [{
            type: 'text',
            text: `ferramenta desconhecida: ${name}`
        }]
    };
});

const transport = new StdioServerTransport();

await server.connect(transport);