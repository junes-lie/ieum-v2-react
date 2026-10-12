"""Optional eta=0 DDIM diagnostic; never replaces the pinned native sampler.

Reference: https://github.com/CompVis/latent-diffusion/blob/main/ldm/models/diffusion/ddim.py
Uses actual training timesteps and the previous selected schedule alpha.
"""
def sample_reference_ddim(diffusion, encodings, steps, terminal_alpha_one=False):
    import torch
    schedule = diffusion.Get_DDIM_Steps(ddim_steps=steps).to(encodings.device)
    assert len(schedule) == steps and steps > 1
    assert torch.all(schedule[1:] > schedule[:-1])
    alphas = diffusion.alphas_cumprod[schedule]
    # Explicit option, also matching pinned alphas_cumprod_prev[0] == 1.
    # https://huggingface.co/docs/diffusers/api/schedulers/ddim#set_alpha_to_one
    terminal = torch.ones_like(alphas[:1]) if terminal_alpha_one else diffusion.alphas_cumprod[:1]
    previous = torch.cat((terminal, alphas[:-1]))
    features = torch.randn((encodings.size(0), diffusion.feature_size, encodings.size(2)), device=encodings.device)
    for index in reversed(range(steps)):
        timestep = torch.full((encodings.size(0),), int(schedule[index]), dtype=torch.long, device=encodings.device)
        epsilon = diffusion.denoiser(features=features, encodings=encodings, diffusion_steps=timestep)
        predicted_clean = (features - (1 - alphas[index]).sqrt() * epsilon) / alphas[index].sqrt()
        features = previous[index].sqrt() * predicted_clean + (1 - previous[index]).sqrt() * epsilon
    return features
