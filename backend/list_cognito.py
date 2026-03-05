import boto3
c = boto3.client('cognito-idp', 'us-east-1')
pools = c.list_user_pools(MaxResults=10)['UserPools']
with open('cognito_pools.txt', 'w') as f:
    for p in pools:
        clients = c.list_user_pool_clients(UserPoolId=p['Id'])['UserPoolClients']
        f.write(f"{p['Name']} ({p['Id']})\n")
        for cl in clients:
            f.write(f"  Client: {cl['ClientName']} -> {cl['ClientId']}\n")
