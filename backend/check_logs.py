import boto3

logs = boto3.client('logs', region_name='us-east-1')

streams = logs.describe_log_streams(
    logGroupName='/aws/lambda/sarathi-invoke-agent',
    orderBy='LastEventTime',
    descending=True,
    limit=3
)

for stream in streams['logStreams']:
    stream_name = stream['logStreamName']
    print(f"\n=== Stream: {stream_name} ===")
    
    events = logs.get_log_events(
        logGroupName='/aws/lambda/sarathi-invoke-agent',
        logStreamName=stream_name,
        limit=15,
        startFromHead=False
    )
    
    for e in events['events']:
        msg = e['message'].strip()
        if 'Error' in msg or 'error' in msg or 'Invoking' in msg or 'accessDenied' in msg:
            print(msg)
