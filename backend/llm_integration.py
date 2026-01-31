#!/usr/bin/env python3
import boto3
import time
import traceback
import sys

print("🔍 Testing AWS credentials...")
try:
    sts = boto3.client('sts', region_name='us-east-2')
    identity = sts.get_caller_identity()
    print(f"✅ Credentials: {identity['Arn']}")
except Exception as e:
    print(f"❌ Credentials FAILED: {e}")
    sys.exit(1)

print("\n🔍 Testing Bedrock...")
try:
    bedrock = boto3.client('bedrock', region_name='us-east-2')
    print("✅ Bedrock client OK")
except Exception as e:
    print(f"❌ Bedrock client FAILED: {e}")
    sys.exit(1)

print("\n🚀 Creating Guardrail...")
try:
    response = bedrock.create_guardrail(
        name='stock-news-no-advice-hackathon-1',
        description='Blocks financial advice for LPL AWS hackathon',

        topicPolicyConfig={
            'topicsConfig': [
                {
                    'name': 'Investment Advice',
                    'definition': 'Personalized financial advice or stock recommendations.',
                    'examples': [
                        'Should I buy AAPL?',
                        'Is TSLA a good investment?',
                        'Buy/sell/hold recommendation'
                    ],
                    'type': 'DENY'
                }
            ]
        },

        # FIXED: Updated to camelCase keys
        contentPolicyConfig={
            'filtersConfig': [
                {'type': 'HATE', 'inputStrength': 'HIGH', 'outputStrength': 'HIGH'},
                {'type': 'VIOLENCE', 'inputStrength': 'HIGH', 'outputStrength': 'HIGH'}
            ]
        },

        blockedInputMessaging='Cannot provide investment advice. Ask about news summaries.',
        blockedOutputsMessaging='Response filtered: no financial advice allowed.'
    )

    guardrail_id = response['guardrailId']
    print(f"\n✅ SUCCESS!")
    print(f"Guardrail ID: {guardrail_id}")

    print("⏳ Waiting 60s for propagation...")
    time.sleep(60)

    version_resp = bedrock.create_guardrail_version(guardrailIdentifier=guardrail_id)
    version = version_resp['guardrailVersion']
    print(f"Version: {version}")

    print("\n📋 COPY TO FASTAPI:")
    print(f"GUARDRAIL_ID = '{guardrail_id}'")
    print(f"GUARDRAIL_VERSION = '{version}'")

except Exception as e:
    print(f"❌ FAILED: {e}")
    traceback.print_exc()