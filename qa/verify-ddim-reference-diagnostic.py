import math
import torch
from ddim_reference_diagnostic import sample_reference_ddim

class Fixture:
    feature_size=1
    alphas_cumprod=torch.tensor([.99,.8,.5,.1])
    def __init__(self):self.visited=[]
    def Get_DDIM_Steps(self,ddim_steps):
        assert ddim_steps==3
        return torch.tensor([0,2,3])
    def denoiser(self,features,encodings,diffusion_steps):
        self.visited.append(int(diffusion_steps[0]))
        return torch.full_like(features,.2)

torch.manual_seed(123)
initial=float(torch.randn(1))
expected=initial
for current,previous in [(.1,.5),(.5,.99),(.99,.99)]:
    clean=(expected-math.sqrt(1-current)*.2)/math.sqrt(current)
    expected=math.sqrt(previous)*clean+math.sqrt(1-previous)*.2
torch.manual_seed(123)
fixture=Fixture()
actual=sample_reference_ddim(fixture,torch.zeros(1,1,1),3)
assert fixture.visited==[3,2,0],'Denoiser must receive actual training timesteps'
torch.testing.assert_close(actual,torch.tensor([[[expected]]]),rtol=1e-6,atol=1e-6)
print('PASS independent scalar DDIM equation, selected previous alpha, actual timestep order; no model or music acceptance')
