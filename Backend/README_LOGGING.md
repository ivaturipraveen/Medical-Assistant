# Logging Configuration

This project uses Python's built-in logging module to replace print statements with proper logging throughout the application.

## Setup

The logging configuration is automatically set up when the application starts through `logging_config.py`. No manual setup is required.

## Log Levels Used

- **DEBUG**: Detailed information for debugging (e.g., parsed values, intermediate steps)
- **INFO**: General information about application flow (e.g., requests received, successful operations)
- **WARNING**: Potentially problematic situations (e.g., SMS sending failures, missing optional services)
- **ERROR**: Error conditions that need attention (e.g., database errors, validation failures)

## Log Outputs

### Console Output
- Shows INFO level and above
- Uses simple format: `timestamp - module - level - message`

### File Output (logs/ directory)
- `medical_assistant_YYYY-MM-DD.log`: All logs (DEBUG and above) with detailed format
- `errors_YYYY-MM-DD.log`: Only ERROR and CRITICAL logs
- Includes function names and line numbers for debugging

## Module-Specific Loggers

Each route module has its own logger:
- `api.routes.Bland.patients`
- `api.routes.Bland.appointments` 
- `api.routes.Bland.doctors`

## Examples

```python
import logging

logger = logging.getLogger(__name__)

# Info level - general flow
logger.info(f"Patient validation request received: {data}")

# Debug level - detailed debugging
logger.debug(f"Parsed DOB: {dob}, Phone: {phone}")

# Warning level - potential issues
logger.warning("Date of birth is required but not provided")

# Error level - serious problems
logger.error(f"Unexpected error during patient validation: {e}")
```

## Configuration

To modify logging behavior, edit `logging_config.py`:
- Change log levels for different modules
- Add new log handlers (e.g., email alerts)
- Modify log formats
- Adjust external library log levels

## External Libraries

The following external libraries have their log levels set to WARNING to reduce noise:
- urllib3
- requests  
- google
- twilio 