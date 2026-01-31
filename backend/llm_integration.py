#!/usr/bin/env python3
import boto3
import time
import json

# Use bedrock-agent-runtime for guardrails (not bedrock-runtime)
bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-2')  # Your region

# Create guardrail
response = bedrock_agent.create_guardrail(
    name='stock-news-no-advice',
    description='Blocks investment advice for LPL Financial stock news summarizer hackathon',
    topic_policy_config={
        'topics_config': [
            {
                'name': 'Investment Advice',
                'definition': 'Providing personalized advice, recommendations, or guidance about managing financial assets, investments, stocks, or achieving financial objectives.',
                'examples': [
                    'Should I buy AAPL stock?',
                    'Is TSLA a good investment?',
                    'What stocks should I buy?',
                    'Sell my portfolio?',
                    'Buy/sell/hold recommendation',
                    'Allocate my 401k to tech stocks',
                    'Price target for NVDA',
                    'Strong buy rating'
                ],
                'type': 'DENY'
            },
            {
                'name': 'Trading Recommendations',
                'definition': 'Any guidance on buying, selling, or trading specific securities or timing the market.',
                'examples': [
                    'When should I sell my shares?',
                    'Time to buy the dip?',
                    'Portfolio allocation advice',
                    'Day trading strategy for SPY'
                ],
                'type': 'DENY'
            }
        ]
    },
    content_policy_config={
        'filters_config': [
            {'type': 'HATE', 'input_strength': 'HIGH', 'output_strength': 'HIGH'},
            {'type': 'INSULTS', 'input_strength': 'HIGH', 'output_strength': 'HIGH'},
            {'type': 'SEXUAL', 'input_strength': 'HIGH', 'output_strength': 'HIGH'},
            {'type': 'VIOLENCE', 'input_strength': 'HIGH', 'output_strength': 'HIGH'},
            {'type': 'PROMPT_ATTACK', 'input_strength': 'HIGH', 'output_strength': 'NONE'}
        ]
    },
    word_policy_config={
        'words_config': [
            {'text': 'buy this stock'}, {'text': 'sell now'}, {'text': 'strong buy'},
            {'text': 'portfolio advice'}, {'text': 'investment recommendation'}
        ]
    },
    blocked_input_messaging='I can summarize news but cannot provide investment advice. Ask about factual news content only.',
    blocked_outputs_messaging='Summary filtered for compliance: no investment advice allowed. This is informational only.',
    tags=[
        {'key': 'hackathon', 'value': 'lpl-financial-aws'},
        {'key': 'purpose', 'value': 'block-financial-advice'}
    ]
)

guardrail_id = response['guardrailId']
guardrail_arn = response['guardrailArn']
print(f"✅ Guardrail created!")
print(f"ID: {guardrail_id}")
print(f"ARN: {guardrail_arn}")

print("\n⏳ Waiting 60s for guardrail to become active...")
time.sleep(60)

# Create a version (recommended for production use)
version_response = bedrock_agent.create_guardrail_version(
    guardrail_identifier=guardrail_id,
    description='Version 1 for hackathon deployment'
)
guardrail_version = version_response['guardrailVersion']
print(f"✅ Version created: {guardrail_version}")

print("\n🎉 Copy these to your FastAPI code:")
print(f"GUARDRAIL_ID = '{guardrail_id}'")
print(f"GUARDRAIL_VERSION = '{guardrail_version}'")  # Use this instead of 'DRAFT'

print("\n🔍 Test it in AWS Console: Bedrock > Guardrails > stock-news-no-advice")
