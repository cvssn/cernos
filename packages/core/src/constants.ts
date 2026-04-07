export const CUSTOM_EXTENSION_ENV = "CERNOS_CUSTOM_EXTENSIONS";

export const PLACEHOLDER_EMPTY_EXECUTION_ID = "__UNKNOWN__";
export const PLACEHOLDER_EMPTY_WORKFLOW_ID = "__EMPTY__";

export const HTTP_REQUEST_NODE_TYPE = "cernos-nodes-base.httpRequest";
export const HTTP_REQUEST_AS_TOOL_NODE_TYPE =
	"cernos-nodes-base.httpRequestTool";
export const HTTP_REQUEST_TOOL_NODE_TYPE =
	"@cernos/cernos-nodes-langchain.toolHttpRequest";

export const RESTRICT_FILE_ACCESS_TO = "CERNOS_RESTRICT_FILE_ACCESS_TO";
export const BLOCK_FILE_ACCESS_TO_CERNOS_FILES =
	"CERNOS_BLOCK_FILE_ACCESS_TO_CERNOS_FILES";
export const CONFIG_FILES = "CERNOS_CONFIG_FILES";

export const BINARY_DATA_STORAGE_PATH = "CERNOS_BINARY_DATA_STORAGE_PATH";

export const UM_EMAIL_TEMPLATES_INVITE = "CERNOS_UM_EMAIL_TEMPLATES_INVITE";
export const UM_EMAIL_TEMPLATES_PWRESET = "CERNOS_UM_EMAIL_TEMPLATES_PWRESET";

export const CREDENTIAL_ERRORS = {
	NO_DATA: "nenhum dado foi definido para essas credenciais.",
	DECRYPTION_FAILED:
		'as credenciais não puderam ser descriptografadas. o motivo provável é que uma "encryptionkey" diferente foi usada para criptografar os dados.',
	INVALID_JSON:
		"os dados de credenciais descriptografados não são um json válido.",
	INVALID_DATA: "os dados de credenciais não estão em um formato válido.",
};
