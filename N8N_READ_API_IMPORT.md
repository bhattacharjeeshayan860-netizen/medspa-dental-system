# Read API workflow import

The repository audit found no existing read API workflows and the local n8n instance returns 404 for all seven read routes. The n8n REST workflow API is protected with HTTP 401, so these workflows could not be imported or verified automatically.

## Import

1. Open the target n8n instance.
2. Import `n8n_read_api_workflows.json` as a workflow export.
3. In every Google Sheets node, select the existing Google Sheets credential. No credential ID is stored in this repository.
4. Set the spreadsheet ID to your own spreadsheet. The workflow exports use `YOUR_GOOGLE_SHEETS_SPREADSHEET_ID` as a placeholder; configure the Google Sheets nodes before testing.
5. Confirm the `Patients` tab has row-1 headers and a unique `patient_id` column. The inbound workflow also expects `phone`, `first_name`, `last_treatment`, `conversation_state`, `recent_chat`, `opt_out`, `booking_status`, `last_message`, `last_intent`, and `updated_at`.
6. Configure the Google Gemini credential on the inbound conversation workflow. It must use only verified `Config`/`Offers` facts and return exactly `HUMAN_REQUIRED` when required information is absent or ambiguous.
7. Execute each workflow once in test mode and verify the `Respond to Webhook` node output.
8. Activate the workflows only after the test responses contain real rows.

## Routes created by the templates

- `GET /dashboard`
- `GET /clients`
- `GET /client?patient_id=P0001`
- `GET /conversations?patient_id=P0001`
- `GET /handoffs`
- `GET /offers`
- `GET /config`

The frontend adds the environment prefix. Therefore local test execution uses `/webhook-test/...`, while activated production workflows use `/webhook/...`.

## Response checks

- Dashboard reads `Patients` and `Human Handoffs` and returns calculated `stats`.
- Clients returns the rows from `Patients`.
- Client detail filters `Patients` by `patient_id` and returns a 404 error object when absent.
- Conversations filters `Conversations` by `patient_id` and returns an empty array when there are no records.
- Handoffs returns `Human Handoffs` rows.
- Offers returns only `active=YES` offers whose `valid_until` is today or later in `Asia/Kolkata`.
- Config converts `key`/`value` rows into an object.

These templates are not reported as live or verified until they are imported, credentialed, executed, and checked against the spreadsheet in n8n.

## n8n editor button guide

### Top bar

- **Back / Personal**: returns to the workflow list.
- **Publish**: publishes the current saved version for production triggers. Do not select this until credentials and a test execution are verified.
- **More actions**: rename, edit description/tags, inspect dependencies, export/import JSON, view version history, open settings, or archive.
- **Editor / Executions / Evaluations**: switch between workflow editing, run history, and evaluation results.

### Canvas

- **Execute workflow**: runs the workflow once manually. It does not publish the workflow.
- **Execute step** on a node: tests only the selected node using available input data.
- **Deactivate / Activate** on a node: disables or enables that node without deleting it.
- **Delete**: removes the selected node from the current workflow; use only after confirming its connections.
- **Zoom to Fit, Zoom In, Zoom Out, Tidy Up**: change the canvas view or arrange nodes; these do not change workflow logic.
- **Add first step / Open nodes panel**: add a new node.
- **Add sticky note**: add operator documentation to the canvas.

### Node editor

- **Parameters**: configure the operation, expressions, sheet, endpoint, or model.
- **Settings**: configure node name, notes, error behavior, and execution options.
- **Input / Output**: inspect data only after a test execution; it is not proof of live production delivery.

### Safe publishing sequence

1. Import or save the workflow.
2. Select the Google Sheets, Gemini, and WhatsApp/Meta credentials.
3. Confirm the Patients and Config headers described above.
4. Execute the workflow in test mode and inspect the response and Google Sheets writes.
5. Review the execution for errors and unexpected data.
6. Only then select **Publish**. Keep the workflow unpublished when any external dependency is still unverified.
