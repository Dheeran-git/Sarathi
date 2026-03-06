import boto3
logs = boto3.client('logs', region_name='us-east-1')
fn = 'sarathi-admin-schemes'
group = f'/aws/lambda/{fn}'

try:
    streams = logs.describe_log_streams(
        logGroupName=group,
        orderBy='LastEventTime',
        descending=True,
        limit=1
    )
    if not streams['logStreams']:
        print(f"No log streams for {fn}")
    else:
        stream_name = streams['logStreams'][0]['logStreamName']
        print(f"--- Logs for {fn} ({stream_name}) ---")
        events = logs.get_log_events(
            logGroupName=group,
            logStreamName=stream_name,
            limit=10,
            startFromHead=False
        )
        for e in events['events']:
            print(e['message'].strip())
except Exception as e:
    print(f"Error checking logs: {e}")
