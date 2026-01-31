import boto3
import time

# Use the 'bedrock' client (control plane) to create guardrails, not 'bedrock-agent-runtime'
bedrock = boto3.client('bedrock', region_name='us-east-2')

create_resp = bedrock.create_guardrail(
    name='stock-news-no-advice',
    description='Blocks investment advice for stock news summarizer',
    topicPolicyConfig={
        'topicsConfig': [{
            'name': 'Investment Advice',
            'definition': 'Providing personalized advice or recommendations on managing financial assets, investments, or trading stocks.',
            'examples': [
                'What stocks should I buy?', 'Is AAPL a good investment?', 'Sell my TSLA?',
                'Portfolio allocation advice', 'Buy/sell/hold recommendation'
            ],
            'type': 'DENY'
        }]
    },
    contentPolicyConfig={
        'filtersConfig': [  # High strength on harmful content
            {'type': 'HATE', 'inputStrength': 'HIGH', 'outputStrength': 'HIGH'},
            {'type': 'VIOLENCE', 'inputStrength': 'HIGH', 'outputStrength': 'HIGH'},
            {'type': 'INSULTS', 'inputStrength': 'HIGH', 'outputStrength': 'HIGH'}
        ]
    },
    wordPolicyConfig={
        'wordsConfig': [{'text': 'buy this stock'}, {'text': 'sell now'}, {'text': 'strong buy'}]
    },
    blockedInputMessaging='I cannot provide investment advice. Ask about news summaries only.',
    blockedOutputsMessaging='Summary filtered: no advice allowed. This is for informational purposes only.'
)

guardrail_id = create_resp['guardrailId']
time.sleep(60)  # Wait for creation

version_resp = bedrock.create_guardrail_version(guardrailId=guardrail_id)
guardrail_version = version_resp['version']
print(f'Use guardrail_id={guardrail_id}, version={guardrail_version}')
