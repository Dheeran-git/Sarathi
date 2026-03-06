import boto3
import json
from decimal import Decimal

dynamo = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamo.Table('SarathiApplications')

apps = table.scan().get('Items', [])
for a in apps:
    sid = a.get('schemeId')
    sname = a.get('schemeName')
    pid = a.get('applicationId')
    print(f"App: {pid} | ID: {repr(sid)} ({type(sid)}) | Name: {repr(sname)} ({type(sname)})")
